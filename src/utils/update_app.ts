import {getUsers} from "../tags/users";
import {sendMessage} from './notification';
import { User } from "./interfaces";
import { isDeveloper } from "./auth";

export const updateApp = async (segment: string, data: any, dev?: Boolean): Promise<void> => {
    if (!dev) dev = false;
    const users = getUsers().filter((user: User) => !dev || isDeveloper(user.username));

    await sendMessage({
        users: users,
        data: data
    });
};