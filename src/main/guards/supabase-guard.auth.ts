import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { UserService } from '../user/user.service';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // ⚠️ debe ser la SERVICE KEY, no la anon
);

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    constructor(private userService: UserService) { }

    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) return false;

        // 🔹 Verificamos token con Supabase
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) return false;

        const authUser = data.user;

        // 🔹 Buscar (o crear) el usuario local vinculado a Supabase
        const localUser = await this.userService.findOrCreate(
            authUser.id,
            authUser.user_metadata?.name || authUser.email || 'Sin nombre',
            authUser.email ?? '',
        );

        req.user = localUser;
        return true;
    }
}
