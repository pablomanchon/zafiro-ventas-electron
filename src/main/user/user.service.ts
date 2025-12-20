import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async findByAuthId(authId: string) {
    const user = await this.repo.findOne({ where: { auth_id: authId } });
    return user && !user.deleted ? user : null;
  }

  async create(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async findOrCreate(authId: string, name: string, email: string) {
    let user = await this.findByAuthId(authId);
    if (!user) {
      user = await this.create({ auth_id: authId, name, email });
    }
    return user;
  }

  async findById(id:string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user || user.deleted) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
