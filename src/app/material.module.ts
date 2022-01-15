import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatDialogModule} from '@angular/material/dialog';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';



@NgModule({
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatListModule,
    MatDialogModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule
  ],
  exports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatListModule,
    MatDialogModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule
  ],
})
export class MaterialModule { }
