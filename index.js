const express = require('express')
const app = express();
const palletRouter = require('./router/pallet')
const cors = require('cors')
const { Server } = require('socket.io')

app.use(cors())
app.use(express.json())

app.get("/",(req, res)=>{
	res.send('API for Mobile & tv').status(200)
})

app.use("/pallet",palletRouter)

const server = app.listen(4000,()=>{
	console.log('server is running 4000')
})

const io = new Server(server,{
  cors: {
    origin: ["http://192.168.5.25:5050","http://192.168.5.40"],
    //origin :"*",
    methods: ["GET", "POST"],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'token'],
    credentials: true
  },
  allowEIO3: true
});
app.io = io;
io.on("connection",(socket)=>{
	console.log(socket.id +' is connecting')
	socket.on("disconnect",()=>{
		console.log('socket.io disconnect')
	})
	
	socket.on("onRefresh",(data)=>{
		io.emit("onRefresh",data);
	})
})
