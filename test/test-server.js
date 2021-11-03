let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

describe('GET necessary files', () => {
    it('should return GET status 200 OK for index.html', (done) => {
        chai.request(server)
        .get('/index.html')
        .end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
    it('should return GET status 200 OK styles.css', (done) => {
        chai.request(server)
        .get('/style.css')
        .end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
    it('should return GET status 200 OK game.js', (done) => {
        chai.request(server)
        .get('/platform.js')
        .end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
    // TODO: Implement more unit tests
});

