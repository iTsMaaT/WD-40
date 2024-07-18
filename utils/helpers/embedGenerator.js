const { EmbedBuilder } = require("discord.js");
const { client } = require("@root/index");

/**
 * Generates different types of embedded messages.
 */
class EmbedGenerator extends EmbedBuilder {
    /**
     * Create an error embed.
     * @param {object} data - The data for the embed.
     * @returns {EmbedGenerator} The created error embed.
     */
    error(data) {
        return this.create(data, 0xff0000);
    }

    /**
     * Create a success embed.
     * @param {object} data - The data for the embed.
     * @returns {EmbedGenerator} The created success embed.
     */
    success(data) {
        return this.create(data, 0x00ff00);
    }

    /**
     * Create a warning embed.
     * @param {object} data - The data for the embed.
     * @returns {EmbedGenerator} The created warning embed.
     */
    warning(data) {
        return this.create(data, 0xffff00);
    }

    /**
     * Create an info embed.
     * @param {object} data - The data for the embed.
     * @returns {EmbedGenerator} The created info embed.
     */
    info(data) {
        return this.create(data, 0xffffff);
    }

    /**
     * Create an embed with the given data and color.
     * @param {object} data - The data for the embed.
     * @param {number} color - The color for the embed.
     * @returns {EmbedGenerator} The created embed.
     */
    create(data, color) {
        if (typeof data == "string") data = { description: data };
        return new EmbedGenerator(data)
            .setColor(color)
            .setTimestamp(new Date());
    }

    /**
     * Set the author of the embed.
     * @param {object} user - The user object to set as the author.
     * @returns {EmbedGenerator} The EmbedGenerator instance.
     */
    withAuthor(user) {
        let author;
        if (!client) return this;

        if (user) 
            author = client.users.resolve(user);
        else
            author = client.user;
        
        if (!author) return this;
        console.log(author);
        return this.setAuthor({
            name: author.username,
            iconURL: author.displayAvatarURL(),
        });
    }
}

/**
 * Represents an EmbedGenerator object.
 * @typedef {Object} EmbedGenerator
 * @property {function} error - Create an error embed.
 * @property {function} success - Create a success embed.
 * @property {function} warning - Create a warning embed.
 * @property {function} info - Create an info embed.
 * @property {function} withAuthor - Set the author of the embed.
 */
const embedGenerator = new EmbedGenerator();
Object.freeze(embedGenerator);
module.exports = embedGenerator;
