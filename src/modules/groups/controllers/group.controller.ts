import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { User } from '@prisma/client';
  import { GroupService } from '../services/group.service';
  import { CreateGroupDto } from '../dto/create-group.dto';
  import { SearchGroupsDto } from '../dto/search-groups.dto';
  import { JoinPrivateGroupDto } from '../dto/join-private-group.dto';
  import { InviteUserDto } from '../dto/invite-user.dto';
  import { GroupResponseDto } from '../dto/group-response.dto';
  import { JoinRequestResponseDto } from '../dto/join-request-response.dto';
  import { UserResponseDto } from '../../users/dto/user-response.dto';
  import { JwtAuthGuard } from 'src/common/gaurds/jwt-auth.guard';
  import { CurrentUser } from '../../../common/decorators/current-user.decorator';
  
  @ApiTags('Groups')
  @Controller('groups')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class GroupController {
    constructor(private readonly groupService: GroupService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new group' })
    @ApiResponse({ status: 201, description: 'Group created successfully', type: GroupResponseDto })
    async create(
      @CurrentUser() user: User,
      @Body() createGroupDto: CreateGroupDto,
    ): Promise<GroupResponseDto> {
      return this.groupService.create(user, createGroupDto);
    }
  
    @Get('search')
    @ApiOperation({ summary: 'Search public groups' })
    @ApiResponse({ status: 200, description: 'Groups retrieved successfully' })
    async searchPublicGroups(@Query() searchDto: SearchGroupsDto) {
      return this.groupService.searchPublicGroups(searchDto);
    }
  
    @Post(':id/join')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request to join a public group' })
    @ApiResponse({ status: 200, description: 'Join request submitted successfully' })
    async requestToJoin(
      @CurrentUser() user: User,
      @Param('id') groupId: string,
    ) {
      return this.groupService.requestToJoin(user, groupId);
    }
  
    @Get(':id/members')
    @ApiOperation({ summary: 'Get group members (admin only)' })
    @ApiResponse({ status: 200, description: 'Members retrieved successfully', type: [UserResponseDto] })
    async getGroupMembers(
      @CurrentUser() user: User,
      @Param('id') groupId: string,
    ): Promise<UserResponseDto[]> {
      return this.groupService.getGroupMembers(user, groupId);
    }
  
    @Get(':id/join-requests')
    @ApiOperation({ summary: 'Get pending join requests (admin only)' })
    @ApiResponse({ status: 200, description: 'Join requests retrieved successfully', type: [JoinRequestResponseDto] })
    async getPendingJoinRequests(
      @CurrentUser() user: User,
      @Param('id') groupId: string,
    ) {
      return this.groupService.getPendingJoinRequests(user, groupId);
    }
  
    @Put('join-requests/:requestId/approve')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Approve a join request (admin only)' })
    @ApiResponse({ status: 200, description: 'Join request approved successfully' })
    async approveJoinRequest(
      @CurrentUser() user: User,
      @Param('requestId') requestId: string,
    ) {
      return this.groupService.approveJoinRequest(user, requestId);
    }
  
    @Put('join-requests/:requestId/reject')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reject a join request (admin only)' })
    @ApiResponse({ status: 200, description: 'Join request rejected successfully' })
    async rejectJoinRequest(
      @CurrentUser() user: User,
      @Param('requestId') requestId: string,
    ) {
      return this.groupService.rejectJoinRequest(user, requestId);
    }
  
    @Post(':id/invite')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Invite user to private group (admin only)' })
    @ApiResponse({ status: 200, description: 'Invitation sent successfully' })
    async inviteUserToPrivateGroup(
      @CurrentUser() user: User,
      @Param('id') groupId: string,
      @Body() inviteUserDto: InviteUserDto,
    ) {
      return this.groupService.inviteUserToPrivateGroup(user, groupId, inviteUserDto.email);
    }
  
    @Post('join/private')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Join private group using invite code' })
    @ApiResponse({ status: 200, description: 'Successfully joined the group' })
    async joinPrivateGroup(
      @CurrentUser() user: User,
      @Body() joinPrivateGroupDto: JoinPrivateGroupDto,
    ) {
      return this.groupService.joinPrivateGroup(user, joinPrivateGroupDto.inviteCode);
    }
  
    @Delete(':id/members/:userId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove user from group (admin only)' })
    @ApiResponse({ status: 200, description: 'User removed from group successfully' })
    async removeUserFromGroup(
      @CurrentUser() user: User,
      @Param('id') groupId: string,
      @Param('userId') userId: string,
    ) {
      return this.groupService.removeUserFromGroup(user, groupId, userId);
    }
  }