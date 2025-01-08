import { PlayersByPositionPipe } from './players-by-position.pipe';

describe('PlayersByPositionPipe', () => {
  it('create an instance', () => {
    const pipe = new PlayersByPositionPipe();
    expect(pipe).toBeTruthy();
  });
});
