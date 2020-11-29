import { Client, Collection, GuildMember, TextChannel, User, Snowflake } from 'discord.js';
import * as config from './config.json';
import inquirer from 'inquirer';
import chalk from 'chalk';

interface PrizeWinners {
    name: string;
    winners: User[];
}

const client = new Client();

let guildFetched = false;

const roll = () => {
    console.clear();
    console.log(`\n`);
    const channel = (client.channels.cache.get(config.messageToRoll.channelID) as TextChannel);
    const promise: Promise<Collection<Snowflake, GuildMember>|void> = !guildFetched ? channel.guild.members.fetch() : new Promise((resolve) => resolve());
    promise.then(() => {
        channel.messages.fetch(config.messageToRoll.messageID).then((message) => {
            message.reactions.cache.first()?.fetch().then((reaction) => {
                reaction.users.fetch().then((users) => {
                    users = users.filter((user) => reaction.message.guild?.members.cache.has(user.id) || false)
                    const prizes: PrizeWinners[] = [];
                    config.prizes.forEach((prize) => {
                        const winners = users.random(prize.count);
                        prizes.push({
                            name: prize.name,
                            winners
                        });
                        console.log(`${chalk.green(prize.name)}`);
                        console.log(winners.map((winner) => `${winner.tag}`).join(', ')+'\n');
                    });
                    inquirer.prompt([
                        {
                            name: 'continue',
                            message: 'Are the winners correct?',
                            type: 'confirm'
                        }
                    ]).then((answers) => {
                        if (!answers.continue) roll();
                        else {
                            const message = prizes.map((prize) => {
                                return `**${prize.name}**\n\nWon by ${prize.winners.map((winner) => winner.toString()).join(', ')}!`;
                            }).join('\n\n\n')+'\n\nCongratulations to the winners! :tada:';
                            (client.channels.cache.get(config.outputChannel) as TextChannel).send(message);
                        }
                    })
                });
            });
        });
    });
}

client.on('ready', () => {
    console.log(`Ready. Serving ${client.guilds.cache.size} servers.`);
    roll();    
});

client.login(config.token);
