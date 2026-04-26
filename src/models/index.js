// models/index.js
import Cart from './CartModel.js'
import CartItem from './CartItemModel.js'
import Product from './ProductsModel.js'
import User from './userModel.js'
import Order from './OrderModel.js'
import OrderItem from './OrderItem.js'
import Question from './QuestionModel.js'
import Answer from './AnswerModel.js'
import Notification from './NotificationModel.js'
import Favorite from './FavoriteModel.js'
import Rating from './RatingModel.js'

// Definir asociaciones

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' })
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' })

CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(CartItem, { foreignKey: 'productId' })
//
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' })
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' })

// Relaciones de Order
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'products' })
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })

//Relacion de order user
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' })

OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' })

// Relaciones de preguntas y respuestas
Product.hasMany(Question, { foreignKey: 'productId', as: 'questions' })
Question.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

User.hasMany(Question, { foreignKey: 'userId', as: 'questions' })
Question.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Question.hasOne(Answer, { foreignKey: 'questionId', as: 'answer' })
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' })

User.hasMany(Answer, { foreignKey: 'userId', as: 'answers' })
Answer.belongsTo(User, { foreignKey: 'userId', as: 'user' })

//realciones de preguntas con el user id
User.hasMany(Notification, { foreignKey: 'userId' })
Notification.belongsTo(User, { foreignKey: 'userId' })

User.belongsToMany(Product, {
    through: Favorite,
    as: 'favorites',
    foreignKey: 'userId',
    otherKey: 'productId',
})

Product.belongsToMany(User, {
    through: Favorite,
    as: 'favoritedBy',
    foreignKey: 'productId',
    otherKey: 'userId',
})

// Para poder hacer include con as: 'product'
Favorite.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' })

// Relaciones de Rating
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Rating.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' })
Product.hasMany(Rating, { foreignKey: 'productId', as: 'ratings' })

export {
    Cart,
    CartItem,
    Product,
    User,
    Order,
    OrderItem,
    Question,
    Answer,
    Favorite,
    Rating,
}
