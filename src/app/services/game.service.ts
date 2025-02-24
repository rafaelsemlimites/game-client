import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private hubConnection!: HubConnection;
  private gameState$ = new BehaviorSubject<any>(null);
  private isConnected = false; //  Verifica se a conexão está ativa

  constructor() {
    this.startConnection();
  }

  private startConnection() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7114/gamehub') //  URL do backend
      .withAutomaticReconnect([0, 2000, 5000, 10000]) // Tentativas de reconexão progressivas
      .build();

      this.hubConnection
      .start()
      .then(() => {
        console.log('%c✅ Conectado ao SignalR!', 'color: green; font-weight: bold;');
        this.isConnected = true;
      })
      .catch((err) => {
        console.error('%c❌ Erro ao conectar ao SignalR:', 'color: red; font-weight: bold;', err);
        this.isConnected = false;
    
        //  Tentativa de reconexão automática após 5 segundos
        setTimeout(() => {
          console.warn('🔄 Tentando reconectar ao SignalR...');
          this.hubConnection.start().catch((error) => console.error('❌ Falha ao reconectar:', error));
        }, 5000);
      });
    
    

    //  Atualizar estado do jogo sempre que houver mudanças no backend
    this.hubConnection.on('UpdateGame', (game) => {
      console.log('🔄 Atualização do jogo recebida:', game);
      this.gameState$.next(game);
    });

    //  Notifica reconexão ao servidor
    this.hubConnection.onreconnected(() => {
      console.log('🔄 Reconectado ao servidor!');
      this.isConnected = true;
    });

    //  Notifica perda de conexão
    this.hubConnection.onclose(() => {
      console.warn('⚠️ Conexão perdida com o servidor!');
      this.isConnected = false;
    });
  }

  getGameState() {
    return this.gameState$.asObservable();
  }

  //  Jogador entra no jogo
  joinGame(playerName: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️ Tentativa de entrar no jogo sem conexão ativa.');
      return Promise.reject('Não conectado ao servidor.');
    }

    return this.hubConnection
      .invoke('JoinGame', playerName)
      .catch(err => console.error('❌ Erro ao entrar no jogo:', err));
  }

  //  Jogador faz um clique
  clickButton(): void {
    if (!this.isConnected) {
      console.warn('⚠️ Tentativa de enviar clique sem conexão ativa.');
      return;
    }

    this.hubConnection.invoke('ClickButton')
      .catch(err => console.error('❌ Erro ao clicar:', err));
  }

  //  Jogador sai do jogo
  leaveGame(): void {
    this.hubConnection.invoke('LeaveGame')
      .catch(err => console.error('❌ Erro ao sair do jogo:', err));
  }
  

  //  Reiniciar o jogo
  resetGame(): void {
    if (!this.isConnected) {
      console.warn('⚠️ Tentativa de reset sem conexão ativa.');
      return;
    }

    this.hubConnection.invoke('ResetGame')
      .catch(err => console.error('❌ Erro ao resetar o jogo:', err));
  }
}
