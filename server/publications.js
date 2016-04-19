/**
 * Created by Andries on 10/01/2016.
 */
Meteor.publish('directory', function() {
    return Meteor.users.find({}, {fields: {profile:1}});
});

Meteor.publishComposite('chats', function () {
    return {
        find: function() {
            return Chats.find({});
        },
        children: [
            {
                find: function(chat) {
                    return Messages.find({ chatId: chat._id });
                }
            },
            {
                find: function(chat) {
                    var query = { _id: { $in: chat.userIds } };
                    var options = { fields: { profile: 1 } };

                    return Meteor.users.find(query, options);
                }
            }
        ]
    };
});