import { Injectable } from '@nestjs/common';
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
    return this.repo.findOne({ where: { auth_id: authId } });
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
}
