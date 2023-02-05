console.log('Server started');

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 8080;

const authEnabled =
  process.env.AUTH_ENABLED.toLowerCase() === 'false' || Number(process.env.AUTH_ENABLED) === 0
    ? false
    : process.env.AUTH_ENABLED;

const userApiKey = process.env.USER_API_KEY;
const adminApiKey = process.env.ADMIN_API_KEY;

const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.URI;

app.use(helmet());
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri);

app.listen(port, () => {
  console.log(`Servers is running on the ${port}`);
});

process.on('exit', () => {
  // Closes db connections when server exits
  client.close();
  console.log(' Exit app closed...');
});

process.on('SIGINT', () => {
  // Closes db connections when server crashed or killed
  client.close();
  console.log(' Sigint app closed...');
});

// Catches app requests and checks key from header
const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    return next(res.status(403).send());
  }
  if (
    req.originalUrl.toLowerCase().startsWith('/api/public') &&
    (req.headers.authorization === `Bearer ${userApiKey}` || req.headers.authorization === `Bearer ${adminApiKey}`)
  ) {
    return next();
  }
  if (req.headers.authorization === `Bearer ${adminApiKey}`) {
    return next();
  }
  return next(res.status(403).send());
};

if (authEnabled) {
  app.use(authMiddleware);
}

const validatePost = (post) => {
  const validationResult = {
    isValid: true,
    errors: [],
  };
  if (!post || typeof post !== 'object') {
    validationResult.isValid = false;
    validationResult.errors.push('Request content has to be object');
    return validationResult;
  }
  if (!post.title || typeof post.title !== 'string') {
    validationResult.isValid = false;
    validationResult.errors.push("'title' has to be string and is required");
  }
  if (!post.imageUrl || typeof post.imageUrl !== 'string') {
    validationResult.isValid = false;
    validationResult.errors.push("'imageUrl' has to be string and is required");
  }
  if (!post.content || typeof post.content !== 'string') {
    validationResult.isValid = false;
    validationResult.errors.push("'content' has to be string and is required");
  }
  if (!post.categoryId || typeof post.categoryId !== 'string') {
    validationResult.isValid = false;
    validationResult.errors.push("'categoryId' has to be string and is required");
  }
  if (post.rating) {
    const rating = Number(post.rating);
    if (rating < 1 || rating > 5) {
      validationResult.isValid = false;
      validationResult.errors.push("'rating' has to be withing 1 and 5");
    }
  }

  return validationResult;
};

const validateRating = (rating) => {
  const validationResult = {
    isValid: true,
    errors: [],
  };
  if (!rating || typeof rating !== 'object') {
    validationResult.isValid = false;
    validationResult.errors.push('Request content has to be object');
    return validationResult;
  }
  if (!rating.rating) {
    validationResult.isValid = false;
    validationResult.errors.push("'rating' has to be number between 1 and 5");
    return validationResult;
  }
  const ratingNumber = Number(rating);
  if (ratingNumber < 1 || ratingNumber > 5) {
    validationResult.isValid = false;
    validationResult.errors.push("'rating' has to be number between 1 and 5");
  }

  return validationResult;
};

const validateCategory = (category) => {
  const validationResult = {
    isValid: true,
    errors: [],
  };
  if (!category || typeof category !== 'object') {
    validationResult.isValid = false;
    validationResult.errors.push('Request content has to be object');
    return validationResult;
  }
  if (!category.title || typeof category.title !== 'string') {
    validationResult.isValid = false;
    validationResult.errors.push("'title' has to be string and is required");
  }

  return validationResult;
};

const validateComment = (comment, isPut = false) => {
  const validationResult = {
    isValid: true,
    errors: [],
  };
  if (!comment || typeof comment !== 'object') {
    validationResult.isValid = false;
    validationResult.errors.push('Request content has to be object');
    return validationResult;
  }
  if (!comment.content || typeof comment.content !== 'string') {
    validationResult.isValid = false;
    validationResult.errors.push("'content' has to be string and is required");
  }

  if (!isPut) {
    if (!comment.postId || typeof comment.postId !== 'string') {
      validationResult.isValid = false;
      validationResult.errors.push("'postId' has to be string and is required");
    }
    if (!comment.userName || typeof comment.userName !== 'string') {
      validationResult.isValid = false;
      validationResult.errors.push("'userName' has to be string and is required");
    }
  }

  return validationResult;
};

const validateAdminCheck = (admin) => {
  const validationResult = {
    isValid: true,
    errors: [],
  };
  if (!admin || typeof admin !== 'object') {
    validationResult.isValid = false;
    validationResult.errors.push('Request content has to be object');
    return validationResult;
  }
  if (!admin.key || typeof admin.key !== 'string') {
    validationResult.isValid = false;
    validationResult.errors.push("'key' has to be string and is required");
  }

  return validationResult;
};

const getPost = async (con, id) => {
  const filter = { _id: ObjectId(id) };
  return con.db('food-blog').collection('posts').findOne(filter);
};

const calcNewRatingAvg = (oldRating, oldRatingCount, newRating) => {
  const newAvg = (oldRating * oldRatingCount + newRating) / (oldRatingCount + 1);
  return newAvg;
};

const getCategory = async (con, id) => {
  const filter = { _id: ObjectId(id) };
  return con.db('food-blog').collection('categories').findOne(filter);
};

const getComment = async (con, id) => {
  const filter = { _id: ObjectId(id) };
  return con.db('food-blog').collection('comments').findOne(filter);
};

// ---Posts
app.get('/api/public/posts', async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con
      .db('food-blog')
      .collection('posts')
      .find()
      .project({
        _id: '$_id',
        title: '$title',
        categoryId: '$categoryId',
        createdAt: '$createdAt',
        updatedAt: '$updatedAt',
      })
      .toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.toString() });
  }
});

app.get('/api/public/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const con = await client.connect();
    const data = await getPost(con, id);
    if (data) {
      return res.send(data);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.post('/api/admin/posts', async (req, res) => {
  try {
    const valid = validatePost(req.body);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    const con = await client.connect();
    const existingCategory = getCategory(con, req.body.categoryId);
    if (!existingCategory) {
      return res.status(400).send({ error: 'Category with given categoryId does not exist.' });
    }
    const data = await con.db('food-blog').collection('posts').insertOne({
      title: req.body.title,
      imageUrl: req.body.imageUrl,
      content: req.body.content,
      categoryId: req.body.categoryId,
      rating: 0,
      ratingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (data.insertedId) {
      return res.status(204).send();
    }
    return res.status(500).send({ error: 'Data could not be inserted.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.put('/api/admin/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: ObjectId(id) };
    const valid = validatePost(req.body);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    const con = await client.connect();
    const existingCategory = getCategory(con, req.body.categoryId);
    if (!existingCategory) {
      return res.status(400).send({ error: 'Category with given categoryId does not exist.' });
    }
    const existingPost = await getPost(con, id);
    if (!existingPost) {
      return res.status(404).send({ error: 'Post does not exist.' });
    }
    const updateObj = {
      title: req.body.title,
      imageUrl: req.body.imageUrl,
      content: req.body.content,
      categoryId: req.body.categoryId,
      rating: existingPost.rating,
      ratingCount: existingPost.ratingCount,
      createdAt: existingPost.createdAt,
      updatedAt: Date.now(),
    };
    const data = await con.db('food-blog').collection('posts').updateOne(filter, { $set: updateObj });
    if (data.matchedCount && data.matchedCount > 0) {
      return res.status(204).send();
    }
    return res.status(500).send({ error: 'Data could not be updated.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.delete('/api/admin/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: ObjectId(id) };
    const con = await client.connect();
    const data = await con.db('food-blog').collection('posts').deleteOne(filter);

    if (data.deletedCount && data.deletedCount > 0) {
      return res.status(204).send();
    }
    if (data.deletedCount === 0) {
      return res.status(404).send();
    }
    return res.status(500).send({ error: 'Data could not be deleted.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.put('/api/public/posts-rate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: ObjectId(id) };
    const valid = validateRating(req.body);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    const con = await client.connect();
    const existingPost = await getPost(con, id);
    if (!existingPost) {
      return res.status(404).send({ error: 'Post does not exist.' });
    }
    const updateObj = {
      title: existingPost.title,
      imageUrl: existingPost.imageUrl,
      content: existingPost.content,
      categoryId: existingPost.categoryId,
      rating: calcNewRatingAvg(existingPost.rating, existingPost.ratingCount, req.body.rating),
      ratingCount: existingPost.ratingCount + 1,
      createdAt: existingPost.createdAt,
      updatedAt: Date.now(),
    };
    const data = await con.db('food-blog').collection('posts').updateOne(filter, { $set: updateObj });
    if (data.matchedCount && data.matchedCount > 0) {
      return res.status(204).send();
    }
    return res.status(500).send({ error: 'Data could not be updated.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});
// ---Posts END
// ---Categories
app.get('/api/public/categories', async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con.db('food-blog').collection('categories').find().toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.toString() });
  }
});

app.get('/api/public/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const con = await client.connect();
    const data = await getCategory(con, id);
    if (data) {
      return res.send(data);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.get('/api/public/categories-posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { categoryId: id };
    const con = await client.connect();
    const data = await con
      .db('food-blog')
      .collection('posts')
      .find(filter)
      .project({
        _id: '$_id',
        title: '$title',
        categoryId: '$categoryId',
        createdAt: '$createdAt',
        updatedAt: '$updatedAt',
      })
      .toArray();
    if (data) {
      return res.send(data);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.post('/api/admin/categories', async (req, res) => {
  try {
    const valid = validateCategory(req.body);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    const con = await client.connect();
    const data = await con.db('food-blog').collection('categories').insertOne({
      title: req.body.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (data.insertedId) {
      return res.status(204).send();
    }
    return res.status(500).send({ error: 'Data could not be inserted.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: ObjectId(id) };
    const valid = validateCategory(req.body);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    const con = await client.connect();
    const existingCategory = await getCategory(con, id);
    if (!existingCategory) {
      return res.status(404).send({ error: 'Category does not exist.' });
    }
    const updateObj = {
      title: req.body.title,
      createdAt: existingCategory.createdAt,
      updatedAt: Date.now(),
    };
    const data = await con.db('food-blog').collection('categories').updateOne(filter, { $set: updateObj });
    if (data.matchedCount && data.matchedCount > 0) {
      return res.status(204).send();
    }
    return res.status(500).send({ error: 'Data could not be updated.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    return res.status(501).send({ error: 'Not implemented. Cannot delete categories because of existing posts.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});
// ---Categories END
// ---Comments
app.get('/api/public/comments', async (req, res) => {
  try {
    const con = await client.connect();
    const data = await con.db('food-blog').collection('comments').find().toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: error.toString() });
  }
});

app.get('/api/public/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const con = await client.connect();
    const data = await getComment(con, id);
    if (data) {
      return res.send(data);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.get('/api/public/posts-comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { postId: id };
    const con = await client.connect();
    const data = await con.db('food-blog').collection('comments').find(filter).toArray();
    if (data) {
      return res.send(data);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.post('/api/public/comments', async (req, res) => {
  try {
    const valid = validateComment(req.body);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    const con = await client.connect();
    const existingPost = getPost(con, req.body.categoryId);
    if (!existingPost) {
      return res.status(404).send({ error: 'Post with given postId does not exist.' });
    }
    const data = await con.db('food-blog').collection('comments').insertOne({
      postId: req.body.postId,
      userName: req.body.userName,
      content: req.body.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (data.insertedId) {
      return res.status(204).send();
    }
    return res.status(500).send({ error: 'Data could not be inserted.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.put('/api/admin/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: ObjectId(id) };
    const valid = validateComment(req.body, true);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    const con = await client.connect();
    const existingComment = await getComment(con, id);
    if (!existingComment) {
      return res.status(404).send({ error: 'Comment does not exist.' });
    }
    const updateObj = {
      postId: existingComment.postId,
      userName: existingComment.userName,
      content: req.body.content,
      createdAt: existingComment.createdAt,
      updatedAt: Date.now(),
    };
    const data = await con.db('food-blog').collection('comments').updateOne(filter, { $set: updateObj });
    if (data.matchedCount && data.matchedCount > 0) {
      return res.status(204).send();
    }
    return res.status(500).send({ error: 'Data could not be updated.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

app.delete('/api/admin/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: ObjectId(id) };
    const con = await client.connect();
    const data = await con.db('food-blog').collection('comments').deleteOne(filter);

    if (data.deletedCount && data.deletedCount > 0) {
      return res.status(204).send();
    }
    if (data.deletedCount === 0) {
      return res.status(404).send();
    }
    return res.status(500).send({ error: 'Data could not be deleted.' });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});

// ---Comments END

// ---Admin check
app.post('/api/public/admin', async (req, res) => {
  try {
    const valid = validateAdminCheck(req.body);
    if (!valid.isValid) {
      return res.status(400).send({ error: valid.errors });
    }
    if (req.body.key === adminApiKey) {
      return res.status(204).send();
    }
    return res.status(401).send({ error: "'key' is not correct" });
  } catch (error) {
    return res.status(500).send({ error: error.toString() });
  }
});
// ---Admin check END

