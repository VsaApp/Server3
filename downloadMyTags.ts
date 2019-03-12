import fs from 'fs';
import path from 'path';
import got from 'got';

const downloadTags = async () => {
  console.log('download tags...');
  const file = {
      "users": [
          {
              "id": "0eab8805-cc5e-43dd-b088-c1da9deebb97",
              "tags": {}
          }
      ]
  };
  for (let i = 0; i < file.users.length; i++) {
    file.users[i].tags = JSON.parse((await got('https://api.vsa.2bad2c0.de/tags/' + file.users[i].id)).body);
  }

  fs.writeFileSync(path.resolve(process.cwd(), 'tags.json'), JSON.stringify(file, null, 2));
}

if (module.parent === null) downloadTags();

export default downloadTags;