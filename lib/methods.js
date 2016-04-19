Meteor.methods({
    getAllUsers: function() {
        return Meteor.users.find({}, {fields: {profile: 1}});
    }
})