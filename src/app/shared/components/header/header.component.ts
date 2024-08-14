import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header>
      <nav>
        <ul>
          <li routerLink="/garage">GARAGE</li>
          <li routerLink="/winners">WINNERS</li>
        </ul>
      </nav>
      <h1>ASYNC RACE</h1>
    </header>
  `,
  styles: `
  header {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding:0 1rem ;
  }
  ul{
    padding:0;
    list-style:none;
  }
  li{
    padding: 15px;
    border-radius:8px;
    box-shadow: 0 0 4px 1px white;
    border:3px solid blue;
    margin:15px 0;
    text-align:center;
  }
  li:hover{
    cursor:pointer;
    background-color:rgba(6, 0, 173, 0.148);    transform: scale(1.05);
    transition:transform .5s ease;
  }
  `,
})
export class HeaderComponent {}
