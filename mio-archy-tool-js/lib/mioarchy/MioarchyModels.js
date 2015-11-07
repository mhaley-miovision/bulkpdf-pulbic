'use strict';

function Mioarchy(jobs, orgs, contribs, apps, roles, orgAccountabilites, jobAccountabilities) {
    this.jobs = jobs;
    this.applications = apps;
    this.contributors = contribs;
    this.roles = roles;
    this.organizations = orgs;
    this.orgAccountabilities = orgAccountabilites;
    this.jobAccountabilities = jobAccountabilities;
    this.namesToShortNames = this.buildCollisionFreeShortNameMap();

    // post-rendering populated objects (this is a big of a kludge :( should be a separate resulting object out of the
    // rendering in order to have proper separation of concerns
    this.orgToVertex = []; // orgName -> vertex
    this.jobToVertex = []; // jobName -> vertex
};

Mioarchy.prototype =
{
    Types: {Job: 0, Application: 1, Contributor: 2, Role: 3, Organization: 4, Accountability: 5},

    //==================================================================================================================
    // ORGANIZATION TREE PROPERTIES AND TRAVERSAL
    //==================================================================================================================
    // returns the # of immediate childen of the given organization (does not recurse)
    getOrganizationChildren: function (organization) {
        // loop through all orgs
        // if the org identifies having a parent with the same name as the specified org, we add it to the list of children of that org

        var children = [];
        var orgNames = Object.keys(this.organizations);

        for (var i = 0; i < orgNames.length; i++) {
            // the current org to check for being a parent
            var o = this.organizations[orgNames[i]];

            if (o.parent) {
                if (o.parent.toLowerCase() === organization.name.toLowerCase()) {
                    children.push(o);
                }
            }
        }
        return children;
    },
    getOrganizationJobs: function (organization, recurse) {
        var list = [];

        // jobs at this level
        for (var c in this.jobs) {
            // make sure the job is attached to an org
            var jobOrgName = this.jobs[c].organization;
            if (jobOrgName) {
                // see if the names match
                if (jobOrgName.toLowerCase() === organization.name.toLowerCase()) {
                    list.push(c);
                }
            }
        }

        // jobs at sub levels
        if (recurse) {
            var children = this.getOrganizationChildren( organization );
            for (var i = 0; i < children.length; i++) {
                var childJobs = this.getOrganizationJobs(children[i], true);
                for (var j = 0; j < childJobs.length; j++) {
                    list.push(childJobs[j]);
                }
            }
        }
        return list;
    },
    isDescendantOfOrganization: function (testSubject, desiredParent) {
        if (typeof(desiredParent) == 'undefined' || typeof(desiredParent.name) == 'undefined') {
            console.error("Oops! Need to specify a parent to test.");
            return;
        }
        if (testSubject == null) {
            console.log("Oops! testSubject == null");
            return;
        }
        if (testSubject && testSubject.parent) {
            // is this the parent we are looking for?
            if (testSubject.parent.toLowerCase() === desiredParent.name.toLowerCase()) {
                return true; // yes, this is the parent, thus it's a descendant
            } else {
                // try looking to the parent's parent
                var parent = this.organizations[testSubject.parent];
                return this.isDescendantOfOrganization(parent, desiredParent);
            }
        } else {
            // this org has no parent
            return false;
        }
    },
    // returns the level # of this org
    getOrganizationLevel: function (organization) {
        if (organization.parent) {
            return 1 + this.getOrganizationLevel( this.organizations[organization.parent] );
        }
        return 1;
    },
    // returns jobs that the contributor jobs
    getContributorJobs: function (contributorName) {
        // find all this person's jobs
        var contributor = this.contributors[contributorName];
        var jobList = [];
        for (var j in this.jobs) {
            if (mioarchyClient.mioarchy.jobs[j].contributor.toLowerCase()
                === contributor.name.toLowerCase()) {
                jobList.push(j);
            }
        }
        return jobList;
    },
    //==================================================================================================================
    // APPLICATION AND ORGANIZATION RELATIONSHIPS
    //==================================================================================================================
    // returns an org traversal tree that notes which org node matches the application, with a list of matching jobs
    getApplicationSubordinatesTree: function ( applicationName, organizationName ) {
        var newNode = {children: [], matchingJobs: [], name: organizationName};
        // is this the application parent org?
        /*
        if (this.applications[applicationName].parentOrg === organizationName) {
            newNode.hasAccountabilities = true;
        } else {
           */ newNode.hasAccountabilities = this.applicationHasAccountabilitiesInOrganization(
                applicationName, organizationName);
        //}

        // add matching jobs
        var org = this.organizations[organizationName];
        var jobs = this.getOrganizationJobs( org, false );
        for (var i = 0; i < jobs.length; i++) {
            var matches = this.applicationHasAccountabilitiesInJob( applicationName, jobs[i] );
            if (matches) {
                newNode.matchingJobs.push(jobs[i]);
            }
        }
        // for each child, attach the new subordinate tree
        // there is a case where multiple trees are returned
        var childOrgs = this.getOrganizationChildren( org );
        if (childOrgs && childOrgs.length > 0) {
            for (var i = 0; i < childOrgs.length; i++) {
                var tree = this.getApplicationSubordinatesTree( applicationName, childOrgs[i].name );
                if (tree) {
                    // there are subordinates in this branch, so add them to the new tree
                    newNode.children.push(tree);
                }
            }
        }
        return newNode;
    },
    applicationHasAccountabilitiesInOrganization: function (applicationName, organizationName) {
        var accountabilities = this.orgAccountabilities[organizationName];
        if (accountabilities) {
            for (var i = 0; i < accountabilities.length; i++) {
                if (accountabilities[i].application.toLowerCase() === applicationName.toLowerCase())
                {
                    return true;
                }
            }
        }
        return false;
    },
    applicationHasAccountabilitiesInJob: function (applicationName, jobId) {
        var accountabilities = this.jobAccountabilities[jobId];
        if (accountabilities) {
            for (var i = 0; i < accountabilities.length; i++) {
                if (accountabilities[i].application.toLowerCase() === applicationName.toLowerCase())
                {
                    return true;
                }
            }
        }
        return false;
    },
    //==================================================================================================================
    // UTILITIES
    //==================================================================================================================
    buildCollisionFreeShortNameMap: function() {
        var buildMapping = function(contributorSubset, numLetters) {
            var map = [];
            var error = false;
            for (var name in contributorSubset) {
                var contributor = contributorSubset[name];
                var fn = contributor.firstName;
                var ln = contributor.lastName;
                var fi = fn.substring(0, 1);
                if (numLetters > ln.length) {
                    console.log("ERROR: Contributor name collision could not be resolved!!!");
                    error = true;
                }
                var li = ln.substring(0, numLetters);
                map[contributor.name] = {
                    shortName: (fi + li).toLowerCase(),
                    firstName: fn,
                    lastName: ln,
                    name: contributor.name
                };
            }
            return { map:map, error:error };
        };
        var sortCollisions = function(map) {
            var n = Object.keys(map).length;
            var collidingMap = [];
            var okMap = [];
            for (var i = 0; i < n; i++) {
                var isColliding = false;
                var keyI = Object.keys(map)[i];
                for (var j = 0; j < n; j++) {
                    if (i != j) {
                        var keyJ = Object.keys(map)[j];
                        if (map[keyI].shortName == map[keyJ].shortName) {
                            // we have a collision
                            var containsAlready = false;
                            for (var k in collidingMap) {
                                if (k === keyI) {
                                    containsAlready = true;
                                    break;
                                }
                            }
                            if (!containsAlready) {
                                collidingMap[keyI] = map[keyI];
                            }
                            isColliding = true;
                        }
                    }
                }
                if (!isColliding) {
                    okMap[keyI] = map[keyI];
                }
            }
            return { collidingMap:collidingMap, okMap:okMap };
        }

        var assignGoodKeys = function(finalMap, goodKeys) {
            for (var k in goodKeys) {
                finalMap[k] = goodKeys[k];
            }
        }

        // n passes until no collisions occur
        var passNumber = 1;
        var mappingResult = buildMapping(this.contributors, passNumber);
        var finalMap = [];

        // now continue doing this until there are no name collisions
        var collisionCheckResults = sortCollisions(mappingResult.map);
        // add the good keys
        assignGoodKeys(finalMap, collisionCheckResults.okMap);
        while (Object.keys(collisionCheckResults.collidingMap).length > 0 && !mappingResult.error) {
            passNumber++;
            mappingResult = buildMapping(collisionCheckResults.collidingMap, passNumber);
            collisionCheckResults = sortCollisions(mappingResult.map);
            assignGoodKeys(finalMap, collisionCheckResults.okMap);
        }
        return finalMap;
    },
    loadFromObject: function (obj) {
        if (obj.type) {
            if (obj.type === Mioarchy.prototype.Types.Application) {
                return new Application(obj.id, obj.name, obj.parent);
            } else if (obj.type === Mioarchy.prototype.Types.Role) {
                return new Role(obj.id, obj.name);
            } else if (obj.type === Mioarchy.prototype.Types.Organization) {
                return new Organization(obj.id, obj.name, obj.parent);
            } else if (obj.type === Mioarchy.prototype.Types.Contributor) {
                return new Contributor(obj.id, obj.name, obj.firstName, obj.lastName);
            } else if (obj.type === Mioarchy.prototype.Types.Job) {
                return new Job(obj.id, obj.organization, obj.application, obj.role,
                    obj.accountabilityLevel, obj.accountabilityLabel, obj.contributor, obj.primaryAccountability);
            }
        }
    },
    /* Creates a filtered version of the objects in the hierarchy
        @startDate - nothing prior to this date will be returned
        @endDate - nothing beyond this date will be returned
     */
    createFilteredMioarchy: function(filterParams) {
        var startDate = filterParams.startDate;
        var endDate = filterParams.endDate;

        // utility function to filter a map of object which may or may not have start and end time fields
        var deepCopyMap = function(src, startTime, endTime) {
            var newMap = [];
            var keys = Object.keys(src);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var o = src[k];

                // filter if needed
                var include = true;
                if (startTime && o.startTime && o.startTime < startTime) {
                    include = false;
                }
                if (endTime && o.endTime && o.endTime > endTime) {
                    include = false;
                }
                if (include) {
                    newMap[k] = o;
                }
            }
            return newMap;
        };

        var newMioArchy = {};
        newMioArchy.contributors = deepCopyMap(this.contributors);
        newMioArchy.roles = deepCopyMap(this.roles);
        newMioArchy.jobAccountabilities = deepCopyMap(this.jobAccountabilities);
        newMioArchy.orgAccountabilities = deepCopyMap(this.orgAccountabilities);
        newMioArchy.organizations = deepCopyMap(this.organizations);
        newMioArchy.jobs = deepCopyMap(this.jobs);
        return newMioArchy;
    }
};

function Application(id, name, parentOrg, color, start, end) {
    this.type = Mioarchy.prototype.Types.Application;
    this.id = id;
    this.name = name;
    this.parentOrg = parentOrg;
    this.color = color;
    this.start = start;
    this.end = end;
}

function Role(id, name) {
    this.type = Mioarchy.prototype.Types.Role;
    this.id = id;
    this.name = name;
}

function Organization(id, name, parent, isApplication, start, end) {
    this.type = Mioarchy.prototype.Types.Organization;
    this.id = id;
    this.name = name;
    this.parent = parent;
    this.isApplication = isApplication;
    this.start = start;
    this.end = end;
}

function Contributor(id, name, firstName, lastName, start, end, email, org) {
    this.type = Mioarchy.prototype.Types.Contributor;
    this.id = id;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.start = start;
    this.end = end;
    this.email = email;
    this.org = org;
}

function Job(id, organization, application, role, accountabilityLabel, accountabilityLevel, contributor, primaryAccountability, start, end) {
    this.type = Mioarchy.prototype.Types.Job;
    this.id = id;
    this.organization = organization;
    this.application = application;
    this.role = role;
    this.accountabilityLabel = accountabilityLabel;
    this.accountabilityLevel = accountabilityLevel;
    this.contributor = contributor;
    this.primaryAccountability = primaryAccountability;
    this.start = start;
    this.end = end;
}

function Accountability(id, appId, application, label, rating, accountabilityType, organization, start, end) {
    this.type = Mioarchy.prototype.Types.Accountability;
    this.id = id;
    this.appId = appId;
    this.application = application;
    this.label = label;
    this.rating = rating;
    this.accountabilityType = accountabilityType;
    this.organization = organization;
    this.start = start;
    this.end = end;
}

// module is only define in nodejs context, if this is client side, ignore since the context is 'window'
if ( typeof(module) != "undefined" ) {
    module.exports = {
        Mioarchy: Mioarchy, 
        Application: Application, 
        Role: Role, 
        Organization: Organization, 
        Contributor: Contributor, 
        Job: Job,
        Accountability: Accountability
    };
}

