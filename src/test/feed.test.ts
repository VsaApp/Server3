import request from 'supertest';
import app from '../app';

const username1 = 'group';
const password1 = '123';
const info1 = 'ABC';
const username2 = 'group2';
const password2 = '456';
const info2 = 'DEF';
const posts1: Array<{ title: string, text: string }> = [];
const posts2: Array<{ title: string, text: string }> = [];
const post1 = { title: 'ABC', text: '123', id: '', time: '' };
const post2 = { title: 'DEF', text: '456', id: '', time: '' };
const post3 = { title: 'GHI', text: '789', id: '', time: '' };
const post4 = { title: 'JKL', text: '101112', id: '', time: '' };

request(app).post('/messageboard/groups/add').send({
    username: username1,
    password: password1,
    info: info1
}).then((response: any) => {
    expect(response.body.error).toBeNull();
});
request(app).post('/messageboard/groups/add').send({
    username: username2,
    password: password2,
    info: info2
}).then((response: any) => {
    expect(response.body.error).toBeNull();
});
request(app).post('/messageboard/posts/add/' + username2 + '/' + password2).send(post1).then((response: any) => {
    post1.id = response.body.id;
    post1.time = response.body.time;
    posts2.push(post1);
});
request(app).post('/messageboard/posts/add/' + username1 + '/' + password1).send(post2).then((response: any) => {
    post2.id = response.body.id;
    post2.time = response.body.time;
    posts1.push(post2);
});
request(app).post('/messageboard/posts/add/' + username2 + '/' + password2).send(post3).then((response: any) => {
    post3.id = response.body.id;
    post3.time = response.body.time;
    posts2.push(post3);
});
request(app).post('/messageboard/posts/add/' + username1 + '/' + password1).send(post4).then((response: any) => {
    post4.id = response.body.id;
    post4.time = response.body.time;
    posts1.push(post4);
});
describe('Feed', () => {
    describe('Get', () => {
        test('Missing groups', () => {
            return request(app).post('/messageboard/feed/0/0').then((response: any) => {
                expect(response.body.error).toBe('Missing groups');
            });
        });
        test('Correct', () => {
            return request(app).post('/messageboard/feed/0/1').send({ groups: [username1, username2] }).then((response: any) => {
                expect(response.body[0].time).toBe(post4.time);
                expect(response.body[1].time).toBe(post3.time);
                expect(response.body.length).toBe(2);
            });
        });
    });
});
