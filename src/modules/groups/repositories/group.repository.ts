import { Injectable } from '@nestjs/common';
import { Group, GroupMembership, JoinRequest, Invitation, RequestStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { 
  IGroupRepository, 
  GroupWithDetails, 
  GroupMembershipWithUser, 
  JoinRequestWithUser 
} from '../interfaces/group.interface';

@Injectable()
export class GroupRepository implements IGroupRepository {
  constructor(private readonly db: PrismaService) {}

  async create(ownerId: string, createGroupDto: CreateGroupDto): Promise<GroupWithDetails> {
    const inviteCode = createGroupDto.visibility === 'PRIVATE' ? this.generateInviteCode() : null;

    return this.db.group.create({
      data: {
        ...createGroupDto,
        ownerId,
        inviteCode,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: { select: { memberships: true } },
      },
    });
  }

  async findById(id: string): Promise<Group | null> {
    return this.db.group.findUnique({
      where: { id },
    });
  }

  async findByIdWithDetails(id: string): Promise<GroupWithDetails | null> {
    return this.db.group.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: { select: { memberships: true } },
      },
    });
  }

  async findByInviteCode(inviteCode: string): Promise<GroupWithDetails | null> {
    return this.db.group.findUnique({
      where: { inviteCode },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: { select: { memberships: true } },
      },
    });
  }

  async searchPublicGroups(
    name?: string,
    page = 1,
    limit = 10
  ): Promise<{ groups: GroupWithDetails[]; total: number }> {
    const where = {
      visibility: 'PUBLIC' as const,
      ...(name && {
        name: {
          contains: name,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [groups, total] = await Promise.all([
      this.db.group.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: { select: { memberships: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.group.count({ where }),
    ]);

    return { groups, total };
  }

  async findUserMembership(userId: string, groupId?: string): Promise<GroupMembershipWithUser | null> {
    if (groupId) {
      // Find membership in a specific group using the correct unique constraint
      return this.db.groupMembership.findFirst({
        where: {
          userId,
          groupId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          group: true,
        },
      });
    } else {
      // Find any active membership for the user (business rule: one group per user)
      return this.db.groupMembership.findFirst({
        where: { 
          userId,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          group: true,
        },
      });
    }
  }

  async findUserMemberships(userId: string): Promise<GroupMembershipWithUser[]> {
    return this.db.groupMembership.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: true,
      },
    });
  }

  async createMembership(userId: string, groupId: string): Promise<GroupMembershipWithUser> {
    return this.db.groupMembership.create({
      data: { 
        userId, 
        groupId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: true,
      },
    });
  }

  async removeMembership(userId: string, groupId: string): Promise<void> {
    await this.db.groupMembership.deleteMany({
      where: {
        userId,
        groupId,
      },
    });
  }

  async getMembershipCount(groupId: string): Promise<number> {
    return this.db.groupMembership.count({ 
      where: { 
        groupId,
        status: 'ACTIVE',
      } 
    });
  }

  async getGroupMembers(groupId: string): Promise<GroupMembershipWithUser[]> {
    return this.db.groupMembership.findMany({
      where: { 
        groupId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Method overloading implementation
  async findJoinRequest(userId: string, groupId: string): Promise<JoinRequestWithUser | null>;
  async findJoinRequest(requestId: string): Promise<JoinRequestWithUser | null>;
  async findJoinRequest(userIdOrRequestId: string, groupId?: string): Promise<JoinRequestWithUser | null> {
    if (groupId) {
      // Called with userId and groupId
      return this.db.joinRequest.findUnique({
        where: { userId_groupId: { userId: userIdOrRequestId, groupId } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          group: true,
        },
      });
    } else {
      // Called with just requestId
      return this.db.joinRequest.findUnique({
        where: { id: userIdOrRequestId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          group: true,
        },
      });
    }
  }

  async createJoinRequest(userId: string, groupId: string): Promise<JoinRequest> {
    return this.db.joinRequest.create({
      data: { userId, groupId },
    });
  }

  async updateJoinRequestStatus(id: string, status: RequestStatus): Promise<JoinRequest> {
    return this.db.joinRequest.update({
      where: { id },
      data: { status },
    });
  }

  async getPendingJoinRequests(groupId: string): Promise<JoinRequestWithUser[]> {
    return this.db.joinRequest.findMany({
      where: {
        groupId,
        status: RequestStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async createInvitation(userId: string, groupId: string): Promise<Invitation> {
    return this.db.invitation.create({
      data: { userId, groupId },
    });
  }

  async findInvitation(userId: string, groupId: string): Promise<Invitation | null> {
    return this.db.invitation.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
  }

  generateInviteCode(): string {
    return uuidv4().substring(0, 8).toUpperCase();
  }
}