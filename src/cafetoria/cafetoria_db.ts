import { updateAllAttributes, runDbCmd, toSqlValue, getDbResults, fromSqlValue } from "../utils/database";
import { CafetoriaLogin } from "../utils/interfaces";

/** Sets a new cafetoria login or updates old parameters */
export const setCafetoriaLogin = (username: string, cafetoriaLogin: CafetoriaLogin): void => {
    const updateAttr = {
        keyfob_id: cafetoriaLogin.id,
        keyfob_key: cafetoriaLogin.password,
        timestamp: cafetoriaLogin.timestamp
    };
    const updateStr = updateAllAttributes(updateAttr);
    runDbCmd(`INSERT INTO users_cafetoria VALUES ('${username}', ${toSqlValue(cafetoriaLogin.id)}, ${toSqlValue(cafetoriaLogin.password)}, '${cafetoriaLogin.timestamp}') ${updateStr};`);
}

/** Removes a cafetoria login for a user.
 * 
 *  Only used when the user is deleted
 */
export const rmvCafetoriaLogin = (username: string): void => {
    runDbCmd(`DELETE FROM users_cafetoria WHERE username='${username}';`);
}

/** Returns the cafetoria login data for a user */
export const getCafetoriaLogin = async (username: string): Promise<CafetoriaLogin> => {
    const dbCafetoriaLogin = (await getDbResults(`SELECT * FROM users_cafetoria WHERE username='${username}'`))[0];
    if (!dbCafetoriaLogin) {
        return {
            id: undefined,
            password: undefined,
            timestamp: new Date('1.1.2000').toISOString()
        };
    }
    return {
        id: fromSqlValue(dbCafetoriaLogin.keyfob_id),
        password: fromSqlValue(dbCafetoriaLogin.keyfob_key),
        timestamp: dbCafetoriaLogin.timestamp
    };
}