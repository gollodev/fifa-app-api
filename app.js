const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const helmet    = require('helmet');
const axios     = require('axios');

const port      = process.env.PORT || 8000;
const baseUrl   = 'https://www.easports.com/fifa/ultimate-team/api/fut/item';
const mongoUri  = 'mongodb+srv://root:2424@cluster0.8ky6t.mongodb.net/Fifa-EA-DB?retryWrites=true&w=majority';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

// connect database
mongoose
.connect(mongoUri)
.then(_ => console.log('Database connection established'))
.catch(err => console.error(err))

// models
const PlayerSchema = new mongoose.Schema({
    name    : String,
    position: String,
    nation  : String,
    team    : String
});

const Player = mongoose.model('Player', PlayerSchema);

// save in database
const saveData = async () => {
    const player = await Player.find().count();
    if (player === 0) {
        console.log('saving data in db...');
        try {
            const response = await axios.get(baseUrl);
            if (response.status === 200) {
                let arrPlayer = [];
                response.data.items.map(item => {
                    let formatPlayer = {};
                    formatPlayer['name'] = item.name;
                    formatPlayer['position'] = item.position;
                    formatPlayer['nation'] = item.nation.name;
                    formatPlayer['team'] = item.club.name;
                    arrPlayer.push(formatPlayer);
                });

                Player
                .insertMany(arrPlayer)
                .then(() => console.log('Players added to database successfully!'))
                .catch(err => console.error(err))
            } else {
                console.log('Some error in save players');
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log('db saved');
    }
};

saveData();

app.use('/api/v1/players', async (req, res) => {
    const searchQuery = req.query.search; 
    const orderQuery = req.query.order || 'asc';
    const pageQuery = req.query.page || 1;

    try {
        const players = await Player.find({ name: new RegExp(searchQuery, 'i')}).sort({ name: orderQuery });
        if (players) {
            return res.status(200).json({
                pages       : pageQuery,
                totalPages  : pageQuery,
                items       : players.length,
                totalItems  : players.length,
                players     : players
            });
        } else {
            return res.status(404).json({ message: 'Player not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));

