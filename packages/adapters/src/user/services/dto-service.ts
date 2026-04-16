/**
 * User DTO Service Implementation
 *
 * Provides transformation between User domain entities and UserDTOs.
 * This service is registered in the DI container and accessed via UserDTOTag.
 */

import type { UserDTOService, UserDTO } from "@mirai-app/use-cases";
import type { User } from "@mirai-app/domain";

/**
 * UserDTOService implementation
 *
 * Transforms between User domain entities and UserDTOs for data transfer.
 */
export class UserDTOServiceImpl implements UserDTOService {
  private static instance: UserDTOServiceImpl;

  static getInstance(): UserDTOServiceImpl {
    if (!UserDTOServiceImpl.instance) {
      UserDTOServiceImpl.instance = new UserDTOServiceImpl();
    }
    return UserDTOServiceImpl.instance;
  }

  /**
   * Convert a domain User to a UserDTO
   */
  fromDomain(user: User): UserDTO {
    return {
      id: user.id,
      authUserId: user.authUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      groupId: user.groupId,
      bio: user.bio,
      birthDate: user.birthDate,
      shirtSize: user.shirtSize,
      dietaryRequirements: user.dietaryRequirements,
      medicalInfo: user.medicalInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Convert a UserDTO to domain User (partial, for updates)
   *
   * Note: Full domain reconstruction happens in the domain layer.
   * This partial conversion is for updating existing entities.
   */
  toDomain(dto: Partial<UserDTO>): Partial<User> {
    // Return partial user data that can be merged with existing domain entity
    return {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.nickname !== undefined && { nickname: dto.nickname }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.birthDate !== undefined && { birthDate: dto.birthDate }),
      ...(dto.shirtSize !== undefined && { shirtSize: dto.shirtSize }),
      ...(dto.dietaryRequirements !== undefined && {
        dietaryRequirements: dto.dietaryRequirements,
      }),
      ...(dto.medicalInfo !== undefined && { medicalInfo: dto.medicalInfo }),
    };
  }

  /**
   * Convert multiple domain Users to UserDTOs
   */
  fromDomainList(users: User[]): UserDTO[] {
    return users.map((user) => this.fromDomain(user));
  }
}
