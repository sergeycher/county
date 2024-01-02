import 'should';
import {Realm} from "../realm";
import {Ties} from "./ties.trait";
import {Tie} from "./tie.trait";

function catcher(doer: () => any): Error {
  try {
    doer();
  } catch (e) {
    return e as Error;
  }

  return 'Not an Error' as unknown as Error;
}

describe('Ties', () => {
  let realm = new Realm();

  beforeEach(() => {
    realm = new Realm();
  });

  it('should not be able to connect unit with itself', () => {
    const a = realm.unit();

    catcher(() => a.as(Ties).tie(a)).should.be.instanceof(Error);
  })

  it('should not be able to connect to tie', () => {
    const a = realm.unit();
    const b = realm.unit();

    const tieAB = a.as(Ties).tie(b);

    catcher(() => a.as(Tie)).should.be.instanceof(Error);

    const c = realm.unit();

    catcher(() => c.as(Ties).tie(tieAB.root)).should.be.instanceof(Error);
    tieAB.root.has(Ties).should.be.false();

    catcher(() => tieAB.root.as(Ties)).should.be.instanceof(Error);
  });

  it('should connect and disconnect', () => {
    const a = realm.unit();
    const b = realm.unit();

    const ab = a.as(Ties).tie(b);
    a.as(Ties).tie(b).should.be.exactly(ab);

    b.as(Ties).connectedTo(a).should.be.true();
    a.as(Ties).connectedTo(b).should.be.true();

    ab.break();

    b.as(Ties).connectedTo(a).should.be.false();
    a.as(Ties).connectedTo(b).should.be.false();
  });

  it('should disconnect automatically', () => {
    const a = realm.unit();
    const b = realm.unit();

    a.as(Ties).tie(b);
    b.as(Ties).list('both').should.have.length(1);

    a.despawn();

    b.as(Ties).list('both').should.have.length(0);

    realm.map(u => u).should.have.length(1);
  });

  it('should serialize and deserialize', () => {
    const a = realm.unit('a');
    const b = realm.unit('b');
    a.as(Ties).tie(b);
    const data = realm.toJSON();

    data.should.be.deepEqual({
      a: {},
      b: {},
      'a->b': {'-->': ['a', 'b']}
    });

    realm.clear();

    realm.fromJSON(data);
    realm.unit('a').as(Ties).connectedTo(realm.unit('b')).should.be.true();
    realm.unit('b').as(Ties).connectedTo(realm.unit('a')).should.be.true();
  });
});
