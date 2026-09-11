import { UserRepository } from './user.repository.js';
export class UserService { constructor(private repo = new UserRepository()) {} }
