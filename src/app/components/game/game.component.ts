import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  game$ = this.gameService.getGameState();
  
  playerName = '';
  playerJoined = false;

  //  Propriedades para armazenar o estado do jogo
  currentPlayer: any = null;
  players: any[] = [];
  winner: any = null;
  isGameActive = false;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.game$.subscribe(game => {
      if (game) {
        console.log('🎮 Estado atualizado:', game);
        this.updateGameState(game);

      // Se houver um vencedor e ele for diferente do anterior, dispara os confetes!
      if (game.winner && game.winner !== this.winner) {
        this.winner = game.winner; // Atualiza o vencedor local
        this.startConfetti(); // Dispara confetes para celebrar a vitória!
      }
      }      
    });
  }

  // Atualiza o estado do jogo
  updateGameState(game: any) {
    this.currentPlayer = game.currentPlayer || null;
    this.players = game.players?.filter((p: any) => p.isConnected) || [];    
    const previousWinner = this.winner; // Armazena o vencedor anterior
    this.winner = game.winner || null;    
    const gameWasActive = this.isGameActive;
    this.isGameActive = game.gameStarted || false;

       //  Se um novo jogo começa, mantém os tempos corretos
    if (!gameWasActive && this.isGameActive && this.players.length > 1) {
        console.log("⏳ Novo jogo iniciado, mantendo os tempos corretos!");
    }

    // Se há um vencedor e ele mudou, ativa o efeito de confete
    if (this.winner && this.winner.name === this.playerName) {
        console.log(`🎊 Confetes para ${this.winner.name}!`);
        this.startConfetti();
    }

    //  Se restar apenas um jogador, ele vence automaticamente
    if (this.players.length === 1 && this.isGameActive) {
        this.winner = this.players[0];
        this.isGameActive = false;
        console.log(`🏆 Vencedor automático: ${this.winner.name}`);

        if (this.winner.name === this.playerName) {
            this.startConfetti();
        }
    }
}

  //  Jogador entra no jogo
  joinGame() {
    if (this.playerName.trim()) {
      this.playerJoined = true;
      this.gameService.joinGame(this.playerName);
    }
  }

  //  Jogador faz um clique
  clickButton() {
    if (this.isCurrentPlayer() && this.isGameActive) {
      this.gameService.clickButton();
    }
  }

  //  Sair da partida
  leaveGame() {
    this.gameService.leaveGame();
    this.playerJoined = false;
    this.playerName = '';
  }

  //  Reinicia o jogo (somente quando termina)
  resetGame() {
    if (this.winner) {
      this.winner = null; //  Remove o vencedor do jogo anterior
      this.players.forEach(player => player.totalTime = 0); // ⏳ Reseta tempos no frontend      
      this.gameService.resetGame(); // Chama o backend para reiniciar
    }
  }
  

  //  Verifica se o jogador tem permissão para jogar
  isCurrentPlayer(): boolean {
    return this.currentPlayer?.name === this.playerName;
  }

  //  Limpa o estado local do jogo ao resetar
  private clearGameState() {
    this.currentPlayer = null;
    this.players = [];
    this.winner = null;
    this.isGameActive = false;
  }

  startConfetti() {
    const existingCanvas = document.getElementById("confettiCanvas");
    if (existingCanvas) return; //  Evita criar múltiplos canvases

    const canvas = document.createElement("canvas");
    canvas.id = "confettiCanvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none"; //  Confetes não bloqueiam cliques
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiParticles: any[] = [];

    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 10 + 5,
            speedY: Math.random() * 3 + 2,
            color: `hsl(${Math.random() * 360}, 100%, 70%)`,
        });
    }

    let animationId: number;

    function updateConfetti() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confettiParticles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            p.y += p.speedY;
            if (p.y > canvas.height) p.y = Math.random() * -canvas.height;
        });

        animationId = requestAnimationFrame(updateConfetti);
    }

    updateConfetti();

    //  Remover confetes após 5 segundos
    setTimeout(() => {
        cancelAnimationFrame(animationId);
        document.body.removeChild(canvas);
    }, 5000);
}


  
}
