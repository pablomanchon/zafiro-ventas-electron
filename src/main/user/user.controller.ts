import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 🔹 Crear usuario (normalmente no se usa si viene de Supabase)
  @Post()
  async create(@Body() body: { auth_id: string; name: string; email: string }) {
    return this.userService.create(body)
  }

  // 🔹 Buscar por auth_id (el UUID de Supabase)
  @Get(':authId')
  async findByAuthId(@Param('authId') authId: string) {
    const user = await this.userService.findByAuthId(authId)
    if (!user) return { message: 'User not found' }
    return user
  }

  // 🔹 Endpoint para sincronizar Supabase → Base local
  @Post('sync')
  async syncUser(@Body() body: { auth_id: string; name: string; email: string }) {
    const { auth_id, name, email } = body
    const user = await this.userService.findOrCreate(auth_id, name, email)
    return user
  }
}
