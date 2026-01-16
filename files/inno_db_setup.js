// USER=clusterAdmin PASSWORD="P@ssw0rd3#" HOST=mysql-server3 PORT=3306 mysqlsh -f file.js

let user = os.getenv('USER');
let password = os.getenv('PASSWORD');
let host = os.getenv('HOST');
let port = os.getenv('PORT');
let action = os.getenv('ACTION') || "";
let clusterName = os.getenv('CLUSTER_NAME') || "mysql-cluster";
let mysqlHost = os.getenv('MYSQL_HOST') || "";
let mysqlHostAddress = os.getenv('MYSQL_HOST_ADDRESS') || "";
let topologyMode = os.getenv('TOPOLOGY_MODE') || "";


let uri = `${user}:${encodeURIComponent(password)}@${host}:${port}`;
print("URI:", uri);

let config = dba.checkInstanceConfiguration(uri);
// //DEBUG
// print("current instance config:\n" + JSON.stringify(config, null, 2));

/**
 * Connects to a MySQL instance and returns a session object.
 * This is similar to the provided Python function `shell_session_open`.
 * @param {string} host - The hostname or IP address of the MySQL server.
 * @param {number|string} port - The port number of the MySQL server.
 * @param {string} user - The username for authentication.
 * @param {string} password - The password for authentication.
 * @returns {Session|null} A session object on success, or null on failure.
 */
let startSession = function(host, port, user, password) {
  try {
    const uri = `${user}:${encodeURIComponent(password)}@${host}:${port}`;
    const session = shell.connect(uri);
    print(`Successfully connected to ${session.uri}\n`);
    return session;
  } catch (e) {
    print(`Error connecting: ${e.message}\n`);
    return null;
  }
};

/**
 * Closes the active MySQL shell global session.
 * This is a more robust version of the provided Python function `shell_session_close`.
 * @returns {boolean} True if the session was closed successfully or if there was no active session, false on error.
 */

let closeSession = function() {
  try {
    let session = shell.getSession();
    if (session !== null) {
      // Если заранее сохранили URI при подключении — выводим
      session.close(); // Закрыть сессию
      print("Successfully disconnected.\n");
    } else {
      print("No active session to close.\n");
    }
    return true;
  } catch (e) {
    print(`Error disconnecting: ${e.message}\n`);
    return false;
  }
};

/**
 * Checks if a host is a member of the InnoDB cluster.
 * @param {object} clusterStatus - The object returned by cluster.status().
 * @param {string} host - The hostname to check for.
 * @returns {boolean} True if the host is in the cluster, false otherwise.
 */

let isHostInCluster = function(clusterStatus, host) {
  if (!clusterStatus || !clusterStatus.defaultReplicaSet || !clusterStatus.defaultReplicaSet.topology) {
    print("Invalid or incomplete cluster status object provided.\n");
    return false;
  }

  const topology = clusterStatus.defaultReplicaSet.topology;
  const members = Object.keys(topology);

  // The host from Ansible might be 'mysql-7' but the topology key is 'mysql-7:3306'.
  // We check if any member address starts with the host name followed by a colon.
  return members.some(memberAddress => memberAddress.startsWith(host + ':'));
};


if (config.status === "ok") {
  print("Instance already configured\n");
} else {
  print("Instance not configured. Start to configuring\n");
  dba.configureInstance(uri, {
    password: password,
    interactive: false,
    restart: true
  }).then(session => {
    print("Instance successfully configured\n", session);
  }).catch(err => {
    print("error to configure instance\n", err);
  });
}


if (action === "createCluster") {
  startSession(host, port, user, password);

  let cluster;
  try {
    cluster = dba.getCluster();
    console.log(cluster.status());
  } catch (err) {
    if (err.message.includes("not available through a session to a standalone instance") ||
        err.message.includes("Metadata not found")) {
      print("No cluster found. Creating a new one...\n");
      cluster = dba.createCluster(clusterName);
      print(`Cluster '${cluster.name}' created successfully.\n`);
      console.log(cluster.status());
    } else {
      print("Unexpected error: " + err.message + "\n");
    }
  }
  closeSession();
}



if (action === "addNodes") {
  startSession(host, port, user, password);
  try {
    let cluster = dba.getCluster();
    let status = cluster.status();
    let targetHost = mysqlHostAddress || mysqlHost;

    if (isHostInCluster(status, targetHost)) {
      print(`Instance '${targetHost}' is already part of the cluster '${cluster.getName()}'. Skipping.\n`);
    } else {
      print(`Adding instance '${targetHost}' to the cluster...\n`);
      let nodeUri = `${user}:${encodeURIComponent(password)}@${targetHost}:${port}`;
      cluster.addInstance(nodeUri, {
        recoveryMethod: 'clone',
        interactive: false
      });
      print(`Instance '${targetHost}' added successfully.\n`);
    }
  } catch(err) {
    print("Unexpected error during addNodes action: " + err.message + "\n");
  }
  closeSession();
}


if (topologyMode === "multinode"){
  startSession(host, port, user, password);
  try {
    let cluster = dba.getCluster();
    cluster.switchToMultiPrimaryMode();
  } catch(err) {
    print("Unexpected error during topologyMode action: " + err.message + "\n");
  }
  closeSession();
}

if (topologyMode === "singlenode"){
  startSession(host, port, user, password);
  try {
    let cluster = dba.getCluster();
    cluster.switchToSinglePrimaryMode();
  } catch(err) {
    print("Unexpected error during topologyMode action: " + err.message + "\n");
  }
  closeSession();
}