import { User } from "../entities/user.entity"

export class CreateUserDto {
    name: string
    email: string
    password: string
}

export class UserDto {
    id: string
    name: string
    email: string
    vencDate: Date
}

export function userToDto(u: User) {
    return { id: u.id, name: u.name, email: u.email, vencDate: u.vencDate } as UserDto
}