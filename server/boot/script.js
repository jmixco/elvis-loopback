'use strict';
module.exports = function initDB(app) {
    var mongoDs = app.dataSources.mongoDS;

    mongoDs.automigrate('Person', function (err) {
        if (err) return err;
        var Person = app.models.Person;
        Person.create([
            { username: 'admin', email: 'admin@loop.com', password: 'admin' },
            { username: 'julio', email: 'julio@loop.com', password: 'julio' },
            { username: 'Bob', email: 'bob@projects.com', password: 'opensesame' }
        ], function (err, users) {
            if (err) return err;
            var Role = app.models.Role;
            //create the admin role
            mongoDs.automigrate('Role', function (err) {
                Role.create({ name: 'admin' }, function (err, role) {
                    if (err) return err;
                    var RoleMapping = app.models.RoleMapping;
                    //make bob an admin
                    mongoDs.automigrate('RoleMapping', function (err) {
                        role.principals.create({
                            principalType: RoleMapping.USER,
                            principalId: users[0].id
                        }, function (err, principal) {
                            return err;
                        });
                    });
                    
                });
            });
        });
    });

};