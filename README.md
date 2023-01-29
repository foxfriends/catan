# Settlers of Catan

This is a recreation of the board game The Settlers of Catan by Klaus Teuber.
It was inspired by the apparent lack of a decent online Catan game.

## Usage

```bash
npm install
npm run build # compile the client
mkdir games   # make a folder to save games to
npm start     # run the server
```

Now you can visit `localhost:8888` in browser to play. Other players may join on other
computers by visiting your IP address.

Enter your name and a game name. Other players can join your game by entering the same
game name. Once at least three players have connected, you can press start and the game
will begin.
