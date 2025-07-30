import { Group, GroupMembership, JoinRequest, Invitation, RequestStatus } from '@prisma/client';
import { CreateGroupDto } from '../dto/create-group.dto';

// Extended types for relations
export interface GroupWithDetails extends Group {
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    memberships: number;
  };
}

export interface GroupMembershipWithUser extends GroupMembership {
  user: {
    id: string;
    name: string;
    email: string;
  };
  group?: Group;
}

export interface JoinRequestWithUser extends JoinRequest {
  user: {
    id: string;
    name: string;
    email: string;
  };
  group?: Group;
}

export interface IGroupRepository {
  // Group CRUD operations
  create(ownerId: string, createGroupDto: CreateGroupDto): Promise<GroupWithDetails>;
  findById(id: string): Promise<Group | null>;
  findByIdWithDetails(id: string): Promise<GroupWithDetails | null>;
  findByInviteCode(inviteCode: string): Promise<GroupWithDetails | null>;
  
  // Group search and discovery
  searchPublicGroups(
    name?: string, 
    page?: number, 
    limit?: number
  ): Promise<{ groups: GroupWithDetails[]; total: number }>;
  
  // Membership management
  findUserMembership(userId: string, groupId?: string): Promise<GroupMembershipWithUser | null>;
  findUserMemberships(userId: string): Promise<GroupMembershipWithUser[]>;
  createMembership(userId: string, groupId: string): Promise<GroupMembershipWithUser>;
  removeMembership(userId: string, groupId: string): Promise<void>;
  getMembershipCount(groupId: string): Promise<number>;
  getGroupMembers(groupId: string): Promise<GroupMembershipWithUser[]>;
  
  // Join request management - Method overloading
  findJoinRequest(userId: string, groupId: string): Promise<JoinRequestWithUser | null>;
  findJoinRequest(requestId: string): Promise<JoinRequestWithUser | null>;
  createJoinRequest(userId: string, groupId: string): Promise<JoinRequest>;
  updateJoinRequestStatus(id: string, status: RequestStatus): Promise<JoinRequest>;
  getPendingJoinRequests(groupId: string): Promise<JoinRequestWithUser[]>;
  
  // Invitation management
  createInvitation(userId: string, groupId: string): Promise<Invitation>;
  findInvitation(userId: string, groupId: string): Promise<Invitation | null>;
  
  // Utility methods
  generateInviteCode(): string;
}