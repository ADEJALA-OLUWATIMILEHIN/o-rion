import bcrypt from 'bcryptjs';
import { User } from '../models/index.ts';
import { signToken } from '../middleware/auth.ts';
import { HttpError, notFound } from './httpError.ts';

export async function register(input: { name: string; email: string; password: string; campus?: string; department?: string }) {
  const email = input.email.toLowerCase().trim();
  if (await User.findOne({ where: { email } })) throw new HttpError(409, 'An account with that email already exists');
  const user = await User.create({
    name: input.name.trim(),
    email,
    passwordHash: await bcrypt.hash(input.password, 10),
    campus: input.campus ?? 'UNILAG',
    department: input.department ?? null,
    // Campus emails count as verified students.
    verified: /\.edu(\.[a-z]{2})?$/.test(email.split('@')[1] ?? ''),
  });
  return { user, token: signToken({ id: user.id, email: user.email }) };
}

export async function login(emailRaw: string, password: string) {
  const user = await User.findOne({ where: { email: emailRaw.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return { user, token: signToken({ id: user.id, email: user.email }) };
}

export async function getUser(id: string) {
  const user = await User.findByPk(id);
  if (!user) throw notFound('User');
  return user;
}

export async function updateProfile(id: string, patch: Partial<Pick<User, 'name' | 'campus' | 'department' | 'avatarUrl'>>) {
  const user = await getUser(id);
  await user.update(patch);
  return user;
}
