import { z } from 'zod';

const userSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(8),
    role: z.enum(['admin', 'user', 'doctor', 'laboratory', 'deliverypartner']),
});

export default userSchema;