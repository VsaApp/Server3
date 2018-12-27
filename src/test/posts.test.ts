import request from 'supertest';
import app from '../app';

const username = 'group';
const password = '123';
const info = 'ABC';
let posts: Array<{ title: string, text: string }> = [];
const post1 = { title: 'ABC', text: '123', id: '', time: '' };
const post2 = { title: 'DEF', text: '456', id: '', time: '' };
const post3 = { title: 'GHI', text: '789', id: '', time: '' };

request(app).post('/messageboard/groups/add').send({
    username,
    password,
    info
}).then((response: any) => {
    expect(response.body.error).toBeNull();
});

describe('Posts', () => {
    describe('Add', () => {
        test('Missing title', () => {
            return request(app).post('/messageboard/posts/add/' + username + '/' + password).send({ text: post1.text }).then((response: any) => {
                expect(response.body.error).toBe('Missing title');
            });
        });
        test('Missing text', () => {
            return request(app).post('/messageboard/posts/add/' + username + '/' + password).send({ title: post1.title }).then((response: any) => {
                expect(response.body.error).toBe('Missing text');
            });
        });
        test('Correct', () => {
            expect.assertions(3);
            return request(app).post('/messageboard/posts/add/' + username + '/' + password).send(post1).then((response: any) => {
                expect(response.body.id).not.toBeUndefined();
                expect(response.body.time).not.toBeUndefined();
                expect(response.body.error).toBeNull();
                post1.id = response.body.id;
                post1.time = response.body.time;
                posts.push(post1);
            });
        });
        test('Correctly added', () => {
            expect.assertions(1);
            return request(app).get('/messageboard/posts/list/' + username + '/0/1').then((response: any) => {
                expect(response.body)
                    .toEqual(posts);
            });
        });
        test('Add 2nd post', async (done) => {
            expect.assertions(3);
            const response = await request(app).post('/messageboard/posts/add/' + username + '/' + password).send(post2);
            expect(response.body.id).not.toBeUndefined();
            expect(response.body.time).not.toBeUndefined();
            expect(response.body.error).toBeNull();
            post2.id = response.body.id;
            post2.time = response.body.time;
            posts.push(post2);
            done();
        });
        test('Add 3rd post', async (done) => {
            expect.assertions(3);
            const response = await request(app).post('/messageboard/posts/add/' + username + '/' + password).send(post3);
            expect(response.body.id).not.toBeUndefined();
            expect(response.body.time).not.toBeUndefined();
            expect(response.body.error).toBeNull();
            post3.id = response.body.id;
            post3.time = response.body.time;
            posts.push(post3);
            done();
        });
        test('Sort posts', (done) => {
            posts = posts.sort((a: any, b: any) => {
                return (a.time < b.time) ? 1 : ((a.time > b.time) ? -1 : 0);
            });
            done();
        });
        test('Return all posts', async (done) => {
            expect.assertions(1);
            const response = await request(app).get('/messageboard/posts/list/' + username + '/0/3');
            expect(response.body).toEqual(posts);
            done();
        });
        test('Return only 1 post from them middle', async (done) => {
            const response = await request(app).get('/messageboard/posts/list/' + username + '/1/1');
            expect(response.body[0])
                .toEqual(posts[1]);
            expect(response.body.length).toBe(1);
            done();
        });
    });
});
