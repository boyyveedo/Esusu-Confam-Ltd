import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class UserAlreadyInGroupException extends BusinessException {
  constructor() {
    super('User is already a member of another group', HttpStatus.CONFLICT);
  }
}

export class GroupCapacityExceededException extends BusinessException {
  constructor() {
    super('Group has reached maximum capacity', HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientPermissionsException extends BusinessException {
  constructor() {
    super('Insufficient permissions to perform this action', HttpStatus.FORBIDDEN);
  }
}