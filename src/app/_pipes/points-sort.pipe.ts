import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pointsSort'
})
export class PointsSortPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    console.log(value);

    return value;
  }

}
