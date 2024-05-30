const http = require('http');
const url = require('url');
const querystring = require('querystring');
const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectDB();

async function onRequest(req, res) {
    const path = url.parse(req.url).pathname;
    console.log('Request for ' + path + ' received');

    const query = url.parse(req.url).query;
    const params = querystring.parse(query);
    const username = params["username"];
    const id = params["id"];
    const branch = params["branch"];
    const noticeno = params["noticeno"];
    const content = params["content"];
 

    if (req.url.includes("/insert")) {
        await insertData(req, res, username, id, branch, noticeno, content);
    } else if (req.url.includes("/delete")) {
        await deleteData(req, res, id);
    } else if (req.url.includes("/update")) {
        await updateData(req, res, id, noticeno);
    } else if (req.url.includes("/display")) {
        await displayTable(req, res);
    }
}

async function insertData(req, res, username, id, branch, noticeno, content) {
    try {
        const database = client.db('nb');
        const collection = database.collection('notice');

        const notice = {
            username,
            id,
            branch,
            noticeno,
            content
    
        };

        const result = await collection.insertOne(notice);
        console.log(`${result.insertedCount} document inserted`);
        const htmlResponse = `
            <html>
                <head>
                    <title>User Details</title>
                    <style>
                        table {
                            font-family: Arial, sans-serif;
                            border-collapse: collapse;
                            width: 50%;
                            margin: 20px auto;
                        }
                        td, th {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h2>User Details</h2>
                    <table>
                        <tr>
                            <th>Field</th>
                            <th>Value</th>
                        </tr>
                        <tr>
                            <td>Username</td>
                            <td>${username}</td>
                        </tr>
                        <tr>
                            <td>ID</td>
                            <td>${id}</td>
                        </tr>
                        <tr>
                            <td>Branch</td>
                            <td>${branch}</td>
                        </tr>
                        <tr>
                            <td>Mobile No</td>
                            <td>${noticeno}</td>
                        </tr>
                        <tr>
                            <td>content</td>
                            <td>${content}</td>
                        </tr>
                    </table>
                    <a href="/display">View Inserted Table</a>
                </body>
            </html>
        `;

        // Write the HTML response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(htmlResponse);
        res.end();
    } catch (error) {
        console.error('Error inserting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function deleteData(req, res, id) {
    try {
        const database = client.db('nb');
        const collection = database.collection('notice');
        const filter = { id: id };
        const result = await collection.deleteOne(filter);
        console.log(`${result.deletedCount} document deleted`);
        if (result.deletedCount === 1) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Document deleted successfully');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Document not found');
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function updateData(req, res, id, newPhoneno) {
    try {
        const database = client.db('nb');
        const collection = database.collection('notice');

        const filter = { id: id };

        const updateDoc = {
            $set: { noticeno: newPhoneno }
        };

        const result = await collection.updateOne(filter, updateDoc);
        console.log(`${result.modifiedCount} document updated`);

        if (result.modifiedCount === 1) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Notice id updated successfully');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('notice ID not found');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function displayTable(req, res) {
    try {
        const database = client.db('nb');
        const collection = database.collection('notice');

        const cursor = collection.find({});
        const notices = await cursor.toArray();

        let tableHtml = `
            <html>
                <head>
                    <title>notice Details</title>
                    <style>
                        table {
                            font-family: Arial, sans-serif;
                            border-collapse: collapse;
                            width: 100%;
                        }
                        th, td {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h2>notice Details</h2>
                    <table>
                        <tr>
                            <th>USERNAME</th>
                            <th>ID</th>
                            <th>BRANCH</th>
                            <th>NOTICE NO.</th>
                            <th>CONTENT</th>
                            
                        </tr>
        `;
        notices.forEach(notice => {
            tableHtml += `
                <tr>
                    <td>${notice.username}</td>
                    <td>${notice.id}</td>
                    <td>${notice.branch}</td>
                    <td>${notice.noticeno}</td>
                    <td>${notice.content}</td>
                    
                </tr>
            `;
        });
        tableHtml += `
                    </table>
                </body>
            </html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(tableHtml);
        res.end();
    } catch (error) {
        console.error('Error displaying table:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

http.createServer(onRequest).listen(7050);
console.log('Server is running...');
