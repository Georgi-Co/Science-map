'use strict';

const { importProjects } = require('./seed-projects');

module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    try {
      await importProjects(strapi);
    } catch (error) {
      console.error('Error importing demo projects into Strapi:', error);
    }
  },
};

