import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-player-stats-dialog',
  templateUrl: './player-stats-dialog.component.html',
  styleUrls: ['./player-stats-dialog.component.scss']
})
export class PlayerStatsDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<PlayerStatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public player: any
  ) { }

  ngOnInit(): void {
    // console.log(this.player);
  }

}
