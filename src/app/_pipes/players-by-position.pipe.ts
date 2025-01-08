import { Pipe, PipeTransform } from '@angular/core';
import { Player } from '../../../types/Player';

@Pipe({
  name: 'playersByPosition',
})
export class PlayersByPositionPipe implements PipeTransform {
  transform(players: Player[] | null, positions: string[]): Player[] {
    return players?.filter((player) => positions.includes(player.pos)) || [];
  }
}
