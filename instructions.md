To run the final project, first go into the backend directory (something like `cd backend`) and run `python3 app.py`. Note that flask here is in port 8000 instead of port 5000,
since Cors seems to have a bug with port 5000

Once flask is started, go to the belay directory (`cd ../belay`) and then execute the command `npm run dev` to get the belay website running at `http://localhost:3000`