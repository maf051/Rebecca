import { appRoot } from '@prisma/composer';
import web from './service.mjs';

export default appRoot('testvibecilo', ({ provision }) => {
  provision(web);
});
