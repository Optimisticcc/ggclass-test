// const fs = require("fs");
// const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.coursework.me",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Classroom API.
  authorize(JSON.parse(content), listCourses);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the first 10 courses the user has access to.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listCourses(auth) {
  const classroom = google.classroom({ version: "v1", auth });
  classroom.courses.list(
    {
      pageSize: 10,
    },
    (err, res) => {
      if (err) return console.error("The API returned an error: " + err);
      const courses = res.data.courses;
      if (courses && courses.length) {
        console.log("Courses:");
        courses.forEach((course) => {
          console.log(`${course.name} (${course.id})`);
        });
      } else {
        console.log("No courses found.");
      }
    }
  );
}

async function getCourse(auth, courseId) {
  const classroom = google.classroom({ version: "v1", auth });
  try {
    // Get the course details using course id
    const course = await classroom.courses.get({
      id: courseId,
    });
    console.log("🚀 ~ file: index.js ~ line 128 ~ getCourse ~ course", course);
  } catch (err) {
    // TODO (developer) - Handle Courses.get() exception of Handle Classroom API
    console.log(
      "Failed to found course %s with error %s ",
      courseId,
      err.message
    );
  }
}

async function createCourse(auth, data) {
  console.log("🚀 ~ file: index.js ~ line 120 ~ createCourse ~ data", data);
  const classroom = google.classroom({ version: "v1", auth });
  try {
    // Create the course using course details.
    const course = await classroom.courses.create({
      requestBody: {
        ...data,
      },
    });
    return course.data.id;
  } catch (err) {
    // TODO (developer) - Handle Courses.create() exception
    console.log(
      "Failed to create course %s with an error %s",
      data.name,
      err.message
    );
  }
}
async function updateCourse(auth, courseId, data) {
  console.log("🚀 ~ file: index.js ~ line 160 ~ updateCourse ~ data", data);
  console.log(
    "🚀 ~ file: index.js ~ line 160 ~ updateCourse ~ courseId",
    courseId
  );
  const classroom = google.classroom({ version: "v1", auth });
  try {
    // nhung truong co the update
    //     name
    // section
    // descriptionHeading
    // description
    // room
    // courseState
    // ownerId
    // Create the course using course details.
    let course = await classroom.courses.get({
      id: courseId,
    });
    let courseUpdate = {
      ...course.data,
      ...data,
    };
    course = await classroom.courses.update({
      id: courseId,
      requestBody: {
        ...courseUpdate,
      },
    });
    console.log(
      "🚀 ~ file: index.js ~ line 174 ~ updateCourse ~ course",
      course
    );
  } catch (err) {
    // TODO (developer) - Handle Courses.create() exception
    console.log(
      "Failed to update course %s with an error %s",
      courseId,
      err.message
    );
  }
}

async function deleteCourse(auth, courseId) {
  console.log(
    "🚀 ~ file: index.js ~ line 160 ~ updateCourse ~ courseId",
    courseId
  );
  const classroom = google.classroom({ version: "v1", auth });
  try {
    let course = await classroom.courses.get({
      id: courseId,
    });
    console.log(
      "🚀 ~ file: index.js ~ line 215 ~ deleteCourse ~ course",
      course.data.id
    );
    if (course.data.id) {
      const deletedCourse = await classroom.courses.delete({
        id: course.data.id,
      });
      console.log(
        "🚀 ~ file: index.js ~ line 219 ~ deleteCourse ~ deletedCouse",
        deletedCourse.data
      );
    }
  } catch (err) {
    // TODO (developer) - Handle Courses.create() exception
    console.log(
      "Failed to delete course %s with an error %s",
      courseId,
      err.message
    );
  }
}
// [END classroom_quickstart]
app.get('/api/course',async (req,res,next)=>{
    fs.readFile("credentials.json", (err, content) => {
        if (err) return console.log("Error loading client secret file:", err);
        authorize(JSON.parse(content), listCourses);
      });
    
      let authorize = (credentials, callback) => {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirect_uris[0]
        );
    
        fs.readFile(TOKEN_PATH, (err, token) => {
          oAuth2Client.setCredentials(JSON.parse(token));
          callback(oAuth2Client);
        });
      };
})

app.post("/api/course/create", async (req, res, next) => {
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), createCourse);
  });

  let authorize = (credentials, callback) => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile(TOKEN_PATH, (err, token) => {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client, req.body);
    });
  };
  //   console.log("🚀 ~ file: index.js ~ line 121 ~ app.post ~ req", req.body);
});
app.get("/api/course/:id", async (req, res, next) => {
  console.log("🚀 ~ file: index.js ~ line 183 ~ app.get ~ req", req.params);
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), getCourse);
  });

  let authorize = (credentials, callback) => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile(TOKEN_PATH, (err, token) => {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client, req.params);
    });
  };
});

app.put("/api/course/:id", async (req, res, next) => {
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), updateCourse);
  });

  let authorize = (credentials, callback) => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile(TOKEN_PATH, (err, token) => {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client, req.params.id, req.body);
    });
  };
  //   console.log("🚀 ~ file: index.js ~ line 121 ~ app.post ~ req", req.body);
});

app.delete("/api/course/:id", async (req, res, next) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, "./service-account-file.json"),
    scopes: ["https://www.googleapis.com/auth/classroom.courses"],
  });
  const authClient = await auth.getClient();
  google.options({ auth: authClient });
  const classroom = google.classroom({ version: "v1", auth: authClient });
    const deletedCourse = await classroom.courses.get({
      id: req.params.id,
    });
    console.log(
      "🚀 ~ file: index.js ~ line 310 ~ app.delete ~ deletedCourse",
      deletedCourse
    );
  //   fs.readFile("credentials.json", (err, content) => {
  //     if (err) return console.log("Error loading client secret file:", err);
  //     authorize(JSON.parse(content), deleteCourse);
  //   });

  //   let authorize = (credentials, callback) => {
  //     const { client_secret, client_id, redirect_uris } = credentials.installed;
  //     const oAuth2Client = new google.auth.OAuth2(
  //       client_id,
  //       client_secret,
  //       redirect_uris[0]
  //     );

  //     fs.readFile(TOKEN_PATH, (err, token) => {
  //       oAuth2Client.setCredentials(JSON.parse(token));
  //       callback(oAuth2Client, req.params.id);
  //     });
  //   };
  //   console.log("🚀 ~ file: index.js ~ line 121 ~ app.post ~ req", req.body);
});
const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  console.log(`server is running at http://localhost:${process.env.PORT}`);
});
