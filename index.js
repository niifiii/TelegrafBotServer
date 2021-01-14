const secureEnv = require('secure-env');
global.env = secureEnv({secret:'mySecretPasswordisSecret'}); //npx secure-env .env -s mySecretPasswordisSecret

const {Telegraf} = require('telegraf')
//const fs = require('fs/promises')
//const fetch = require('node-fetch');
//const withQuery = require('with-query').default;
const fetch = require('node-fetch')
//const { MenuTemplate, MenuMiddleware } = require('telegraf-inline-menu')
//const cors = require('cors');

const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient;

const NewsAPI = require('newsapi');

const NEWS_APIKEY = global.env.NEWS_APIKEY
const newsapi = new NewsAPI(NEWS_APIKEY);

//MongoDB
//MongoDb Database Settings
const MONGO_DATABASE = global.env.MONGO_DATABASE;
const MONGO_TWITS_COLLECTION = global.env.MONGO_TWITS_COLLECTION;
const MONGO_USERINFO_COLLECTION = global.env.MONGO_USERINFO_COLLECTION;
const MONGO_URL = global.env.MONGO_URL //Set MongoDb URL

const mongoClient = new MongoClient(
    MONGO_URL, //Pass in the MONGO_URL here
    { useNewUrlParser: true, useUnifiedTopology: true }); //because deprecation
                                //^no explicit connects

//create a bot
//dun put in in env put it here

const bot = new Telegraf(global.env.TELEGRAM_TOKEN)

//when a user starts a session with your bot
bot.start(ctx => { //start returns a promise, ctx is telegraf context

    //ctx.replyWithPhoto(HELLO_KITTY, {caption: 'Hello from Hello Kitty'} )

    ctx.reply('Welcome to my "/news <country code>" and "/tweets <user name>" bot') //audio html.. //reply retruns expects a promise //send s amessage to the telegram bot FSD202020_bot
})

bot.hears('hi', ctx => ctx.reply('Hi'));
 
bot.command('news', async ctx => { // /news singapore
    //console.info('ctx', ctx);
    //console.info('ctx.message', ctx.message)

    const length = ctx.message.entities[0].length
    const country = ctx.message.text.substring(length+1)
    console.info(country)

    if (!country || country.length < 2 || country.length > 2 ) {
        console.log('country', country)
        ctx.reply(`Please enter a value from: ae ar at au be bg br ca ch cn co cu cz de eg fr gb gr hk hu id ie il in it jp kr lt lv ma mx my ng nl no nz ph pl pt ro rs ru sa se sg si sk th tr tw ua us ve za`)
        return ctx
    }

    //if (country.toLowerCase == 'singapore') country = 'sg'
    ctx.reply(`So you want news from ${country}`)
    //ctx.country = country

    const pageSize = 5

    var results = await newsapi.v2.topHeadlines({
        pageSize,
        country
      }).then(response => {
        console.log(response); 
        return response;
    })

    const articles = results.articles

    for (let item of articles) {
        await ctx.reply(`-----------------------------`)
        if (item.urlToImage) 
            await ctx.replyWithPhoto(`${item.urlToImage}`)
        await ctx.reply(`${item.title}`)
        await ctx.reply(`${item.description}`)
    }
    
    return ctx
})

bot.command('tweets', async ctx => { 
    console.log(ctx.message)
    const length = ctx.message.entities[0].length
    const userName = ctx.message.text.substring(length+1)
    console.info(userName)

    if (!userName) {
        console.log('Username: ', userName)
        ctx.reply(`Please provide a username`)
        return ctx
    }

    ctx.reply(`So you want tweets from ${userName}`)

    const find5Tweets = mongoClient.db(MONGO_DATABASE).collection(MONGO_TWITS_COLLECTION).find({'userName': userName}).limit(5)

    const findResults = []

    await find5Tweets.forEach(
        function(myDoc) { findResults.unshift(myDoc)}
    )

    if (findResults.length === 0) {
        ctx.reply('No tweets found.')
    } else {
        for (let item of findResults) {
            await ctx.reply(`-----------------------------`)
            if (item.comment != '')
            await ctx.reply(`${item.comment}`)
            await ctx.reply('No comment')
            await ctx.reply(`${item.created}`)
        }
        ctx.reply('--------------END------------')
    }
})

bot.catch((err, ctx) => {
    console.log(`Oops, encountered an error for ${ctx.updateType}`, err)
})

//start the bot
const mongoConnection = (async () => { return mongoClient.connect()})();
bot.launch()


process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

mongoConnection.then( (result) => {
    console.log('app running...')})