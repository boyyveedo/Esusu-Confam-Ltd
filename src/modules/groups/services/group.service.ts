import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { User, GroupVisibility, RequestStatus } from '@prisma/client';
import { CreateGroupDto } from '../dto/create-group.dto';
import { GroupResponseDto } from '../dto/group-response.dto';
import { SearchGroupsDto } from '../dto/search-groups.dto';
import { GroupRepository } from '../repositories/group.repository';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { 
  UserAlreadyInGroupException, 
  GroupCapacityExceededException,
  InsufficientPermissionsException 
} from '../../../common/exceptions/business.exception';
import { PaginatedResponse } from '../../../common/interfaces/api-response.interface';

@Injectable()
export class GroupService {
  constructor(private readonly groupRepository: GroupRepository) {}

  async create(user: User, createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
    // Check if user is already in an active group (business rule: one group per user)
    const existingMembership = await this.groupRepository.findUserMembership(user.id);
    if (existingMembership) {
      throw new UserAlreadyInGroupException();
    }

    const group = await this.groupRepository.create(user.id, createGroupDto);
    
    // Automatically add owner as member
    await this.groupRepository.createMembership(user.id, group.id);

    return new GroupResponseDto({
      ...group,
      description: group.description || undefined, // Convert null to undefined
      inviteCode: group.inviteCode || undefined,   // Convert null to undefined
      owner: new UserResponseDto(group.owner),
      memberCount: 1,
    });
  }

  async searchPublicGroups(searchDto: SearchGroupsDto): Promise<PaginatedResponse<GroupResponseDto[]>> {
    const { groups, total } = await this.groupRepository.searchPublicGroups(
      searchDto.name,
      searchDto.page || 1,
      searchDto.limit || 10,
    );

    const groupDtos = groups.map(group => new GroupResponseDto({
      ...group,
      description: group.description || undefined, // Convert null to undefined
      inviteCode: group.inviteCode || undefined,   // Convert null to undefined
      owner: new UserResponseDto(group.owner),
      memberCount: group._count.memberships,
    }));

    return {
      success: true,
      message: 'Groups retrieved successfully',
      data: groupDtos,
      meta: {
        page: searchDto.page || 1,
        limit: searchDto.limit || 10,
        total,
        totalPages: Math.ceil(total / (searchDto.limit || 10)),
      },
    };
  }

  async requestToJoin(user: User, groupId: string): Promise<{ message: string }> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.visibility !== GroupVisibility.PUBLIC) {
      throw new ForbiddenException('Cannot request to join a private group');
    }

    // Check if user is already in any active group
    const existingMembership = await this.groupRepository.findUserMembership(user.id);
    if (existingMembership) {
      throw new UserAlreadyInGroupException();
    }

    // Check if group is at capacity
    const memberCount = await this.groupRepository.getMembershipCount(groupId);
    if (memberCount >= group.maxCapacity) {
      throw new GroupCapacityExceededException();
    }

    // Check if request already exists
    const existingRequest = await this.groupRepository.findJoinRequest(user.id, groupId);
    if (existingRequest) {
      throw new ConflictException('Join request already submitted');
    }

    await this.groupRepository.createJoinRequest(user.id, groupId);

    return { message: 'Join request submitted successfully' };
  }

  async getGroupMembers(user: User, groupId: string): Promise<UserResponseDto[]> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== user.id) {
      throw new InsufficientPermissionsException();
    }

    const members = await this.groupRepository.getGroupMembers(groupId);
    return members.map(membership => new UserResponseDto(membership.user));
  }

  async getPendingJoinRequests(user: User, groupId: string) {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== user.id) {
      throw new InsufficientPermissionsException();
    }

    const requests = await this.groupRepository.getPendingJoinRequests(groupId);
    return requests.map(request => ({
      id: request.id,
      user: new UserResponseDto(request.user),
      createdAt: request.createdAt,
    }));
  }

  async approveJoinRequest(user: User, requestId: string): Promise<{ message: string }> {
    const request = await this.findAndValidateJoinRequest(user, requestId);

    // Check if the requesting user is already in another group
    const existingMembership = await this.groupRepository.findUserMembership(request.userId);
    if (existingMembership) {
      // Update request status to rejected since user is already in a group
      await this.groupRepository.updateJoinRequestStatus(requestId, RequestStatus.REJECTED);
      throw new ConflictException('User is already a member of another group');
    }

    // Check group capacity
    const memberCount = await this.groupRepository.getMembershipCount(request.groupId);
    const group = await this.groupRepository.findById(request.groupId);
    
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    
    if (memberCount >= group.maxCapacity) {
      throw new GroupCapacityExceededException();
    }

    // Update request status and create membership
    await Promise.all([
      this.groupRepository.updateJoinRequestStatus(requestId, RequestStatus.APPROVED),
      this.groupRepository.createMembership(request.userId, request.groupId),
    ]);

    return { message: 'Join request approved successfully' };
  }

  async rejectJoinRequest(user: User, requestId: string): Promise<{ message: string }> {
    await this.findAndValidateJoinRequest(user, requestId);

    await this.groupRepository.updateJoinRequestStatus(requestId, RequestStatus.REJECTED);

    return { message: 'Join request rejected successfully' };
  }

  async inviteUserToPrivateGroup(user: User, groupId: string, inviteeEmail: string): Promise<{ message: string; inviteCode: string }> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== user.id) {
      throw new InsufficientPermissionsException();
    }

    if (group.visibility !== GroupVisibility.PRIVATE) {
      throw new ForbiddenException('Can only invite users to private groups');
    }

    if (!group.inviteCode) {
      throw new Error('Private group is missing invite code');
    }

    // Check group capacity
    const memberCount = await this.groupRepository.getMembershipCount(groupId);
    if (memberCount >= group.maxCapacity) {
      throw new GroupCapacityExceededException();
    }

    // In a real implementation, you'd:
    // 1. Find user by email
    // 2. Create invitation record
    // 3. Send email with invite code
    // For now, we'll return the invite code
    return {
      message: 'Invitation sent successfully',
      inviteCode: group.inviteCode,
    };
  }

  async joinPrivateGroup(user: User, inviteCode: string): Promise<{ message: string }> {
    const group = await this.groupRepository.findByInviteCode(inviteCode);
    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if user is already in any active group
    const existingMembership = await this.groupRepository.findUserMembership(user.id);
    if (existingMembership) {
      throw new UserAlreadyInGroupException();
    }

    // Check group capacity
    const memberCount = await this.groupRepository.getMembershipCount(group.id);
    if (memberCount >= group.maxCapacity) {
      throw new GroupCapacityExceededException();
    }

    await this.groupRepository.createMembership(user.id, group.id);

    return { message: 'Successfully joined the group' };
  }

  async removeUserFromGroup(user: User, groupId: string, userId: string): Promise<{ message: string }> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== user.id) {
      throw new InsufficientPermissionsException();
    }

    if (userId === user.id) {
      throw new ForbiddenException('Cannot remove yourself from the group');
    }

    const membership = await this.groupRepository.findUserMembership(userId, groupId);
    if (!membership) {
      throw new NotFoundException('User is not a member of this group');
    }

    await this.groupRepository.removeMembership(userId, groupId);

    return { message: 'User removed from group successfully' };
  }

  async leaveGroup(user: User): Promise<{ message: string }> {
    const membership = await this.groupRepository.findUserMembership(user.id);
    if (!membership) {
      throw new NotFoundException('You are not a member of any group');
    }

    const group = await this.groupRepository.findById(membership.groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    
    if (group.ownerId === user.id) {
      throw new ForbiddenException('Group owner cannot leave the group. Transfer ownership or delete the group first.');
    }

    await this.groupRepository.removeMembership(user.id, membership.groupId);

    return { message: 'Successfully left the group' };
  }

  async getMyGroup(user: User): Promise<GroupResponseDto | null> {
    const membership = await this.groupRepository.findUserMembership(user.id);
    if (!membership) {
      return null;
    }

    const group = await this.groupRepository.findByIdWithDetails(membership.groupId);
    if (!group) {
      return null;
    }

    return new GroupResponseDto({
      ...group,
      description: group.description || undefined, // Convert null to undefined
      inviteCode: group.inviteCode || undefined,   // Convert null to undefined
      owner: new UserResponseDto(group.owner),
      memberCount: group._count.memberships,
    });
  }

  private async findAndValidateJoinRequest(user: User, requestId: string) {
    const request = await this.groupRepository.findJoinRequest(requestId);
    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    const group = await this.groupRepository.findById(request.groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    
    if (group.ownerId !== user.id) {
      throw new InsufficientPermissionsException();
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException('Join request has already been processed');
    }

    return request;
  }
}