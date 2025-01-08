import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Entry } from '../../../types/Entry';
import { AuthService } from 'app/_services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserEntryResolver implements Resolve<Observable<Entry | null>> {
  constructor(private authService: AuthService) {}

  resolve(): Observable<Entry | null> {
    return this.authService.getAuthUserEntry().pipe(first());
  }
}
