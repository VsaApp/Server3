import request from 'supertest';
import app from '../app';

const username1 = 'group';
const password1 = '123';
const info1 = 'ABC';
const posts: Array<{ title: string, text: string }> = [];
const username2 = 'group2';
const password2 = '456';
const info2 = 'DEF';
const status = 'waiting';
const follower = -1;

describe('Groups', () => {
    describe('Add', () => {
        test('Missing username', () => {
            return request(app).post('/messageboard/groups/add').send({
                password: password1,
                info: info1
            }).then((response: any) => {
                expect(response.body.error).toBe('Missing username');
            });
        });
        test('Missing password', () => {
            return request(app).post('/messageboard/groups/add').send({
                username: username1,
                info: info1
            }).then((response: any) => {
                expect(response.body.error).toBe('Missing password');
            });
        });
        test('Missing info', () => {
            return request(app).post('/messageboard/groups/add').send({
                username: username1,
                password: password1,
            }).then((response: any) => {
                expect(response.body.error).toBe('Missing info');
            });
        });
        test('Correct', () => {
            return request(app).post('/messageboard/groups/add').send({
                username: username1,
                password: password1,
                info: info1
            }).then((response: any) => {
                expect(response.body.error).toBeNull();
            });
        });
        test('Already exists', () => {
            return request(app).post('/messageboard/groups/add').send({
                username: username1,
                password: password1,
                info: info1
            }).then((response: any) => {
                expect(response.body.error).toBe('User already exists');
            });
        });
    });
    describe('Activate/Block', () => {
        test('Invalid id', () => {
            return request(app).get('/messageboard/groups/activate/' + '-1').then((response: any) => {
                expect(response.body.error)
                    .toBe('Invalid id');
            });
        });
        // It isn't possible to test b locking and activating groups, beacause you can't know the correct id! (That's good, because it should be save)
    });
    describe('Info', () => {
        test('Invalid username', () => {
            return request(app).get('/messageboard/groups/info/' + username2).then((response: any) => {
                expect(response.body.error)
                    .toBe('Invalid username');
            });
        });
        test('Single', () => {
            return request(app).get('/messageboard/groups/info/' + username1).then((response: any) => {
                expect(response.body)
                    .toEqual({
                        username: username1,
                        info: info1,
                        status,
                        follower,
                        post_count: 0
                    });
            });
        });
        test('Multi', () => {
            return request(app).get('/messageboard/groups/list').then((response: any) => {
                expect(response.body)
                    .toEqual([{
                        username: username1,
                        info: info1,
                        status,
                        follower,
                        post_count: 0
                    }]);
            });
        });
    });
    describe('Update', () => {
        test('Invalid username', () => {
            return request(app).post('/messageboard/groups/update/' + username2 + '/' + password1).send({
                username: username2,
                password: password2,
                info: info2
            }).then((response: any) => {
                expect(response.body.error).toBe('Invalid username');
            });
        });
        test('Invalid credentials', () => {
            return request(app).post('/messageboard/groups/update/' + username1 + '/' + password2).send({
                username: username2,
                password: password2,
                info: info2
            }).then((response: any) => {
                expect(response.body.error).toBe('Invalid credentials');
            });
        });
        test('Correct', () => {
            return request(app).post('/messageboard/groups/update/' + username1 + '/' + password1).send({
                username: username2,
                password: password2,
                info: info2
            }).then((response: any) => {
                expect(response.body.error).toBeNull();
            });
        });
        test('Updated correctly', () => {
            return request(app).get('/messageboard/groups/info/' + username2).then((response: any) => {
                expect(response.body)
                    .toEqual({ username: username2, info: info2, status, follower, post_count: 0 });
            });
        });
        test('Correct', () => {
            return request(app).post('/messageboard/groups/update/' + username2 + '/' + password2).send({
                username: username1,
                password: password1,
                info: info1
            }).then((response: any) => {
                expect(response.body.error).toBeNull();
            });
        });
        test('Updated correctly', () => {
            return request(app).get('/messageboard/groups/info/' + username1).then((response: any) => {
                expect(response.body)
                    .toEqual({
                        username: username1,
                        info: info1,
                        status,
                        follower,
                        post_count: 0
                    });
            });
        });
    });
    describe('Login', () => {
        test('Invalid username', () => {
            return request(app).get('/messageboard/groups/login/' + username2 + '/' + password1).then((response: any) => {
                expect(response.body.error).toBe('Invalid username');
            });
        });
        test('Invalid credentials', () => {
            return request(app).get('/messageboard/groups/login/' + username1 + '/' + password2).then((response: any) => {
                expect(response.body.error).toBe('Invalid credentials');
            });
        });
        test('Correct', () => {
            return request(app).get('/messageboard/groups/login/' + username1 + '/' + password1).then((response: any) => {
                expect(response.body.error).toBeNull();
            });
        });
    });
    describe('Delete', () => {
        test('Invalid username', () => {
            return request(app).get('/messageboard/groups/delete/' + username2 + '/' + password1).then((response: any) => {
                expect(response.body.error).toBe('Invalid username');
            });
        });
        test('Invalid credentials', () => {
            return request(app).get('/messageboard/groups/delete/' + username1 + '/' + password2).then((response: any) => {
                expect(response.body.error).toBe('Invalid credentials');
            });
        });
        test('Correct', () => {
            return request(app).get('/messageboard/groups/delete/' + username1 + '/' + password1).then((response: any) => {
                expect(response.body.error).toBeNull();
            });
        });
        test('Deleted correctly', () => {
            expect.assertions(1);
            return request(app).get('/messageboard/groups/list').then((response: any) => {
                expect(response.body)
                    .toEqual([]);
            });
        });
    });
});