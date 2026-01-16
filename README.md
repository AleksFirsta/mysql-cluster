Mysql-cluster
=========

This Ansible role install and configure **MySQL-Cluster** on Debian and RedHat based systems.  
It handles repository setup, package installation, configuration file deployment, and ensures the MySQL service is restarted when configuration changes are applied.

As the master node, the first host from the inventory is used. If you add an additional entry to the inventory, all the required packages and configurations will be installed, and the host will be added to the cluster.

## Requirements

No special requirements; note that this role requires root access, so either run it in a playbook with a global `become: true`, or invoke the role in your playbook like:

```plaintext
- name: Install and Configure Mysql cluster
  hosts: mysql-cluster
  gather_facts: true
  roles:
    - role: mysql-cluster
      become: true
```

## Role Variables

Available variables are listed below, along with default values (see `defaults/main.yml`):

```plaintext
mysql_version: 8.0
configure_ssl_connection: true
firewall_enabled: true
firewall_port:
  - 3306
  - 3307
  - 33060
  - 33061


# Required params:

mysql_root_pass: ""
mysql_cluster_name: ""
mysql_cluster_admin_user: ""
mysql_cluster_admin_pass: ""
```

At the moment, the cluster is running in `**"topologyMode": "Single-Primary"**`, but it can be switched to `**"topologyMode": "Multi-Primary"**` if necessary. To do this need to add variable `mysql_topology_type: "multinode"`

Example Playbook
----------------

requiremets.yml:

```plauntext
- src: git@github.com:AleksFirsta/ansible-role-mysql-cluster.git
  scm: git
  version: main
  name: mysql-cluster
```

`ansible-galaxy install -r requirements.yml -p roles/`

Including an example of how to use your role (for instance, with variables passed in as parameters) is always nice for users too:

playbook.yml:

```plaintext
- name: Install and Configure Mysql cluster
  hosts: mysql_hosts
  gather_facts: true
  vars:
    mysql_root_pass: "P@ssw0rd3#"
    mysql_cluster_name: "my-cluster"
    mysql_cluster_admin_user: "clusterAdmin"
    mysql_cluster_admin_pass: "P@ssw0rd3#"

  roles:
    - role: mysql-cluster
      become: true
```

Cluster status
----------------

```plaintext
 MySQL  JS > \connect clusterAdmin@test-cluster:3306
Creating a session to 'clusterAdmin@test-cluster:3306'
Please provide the password for 'clusterAdmin@test-cluster:3306': **********
Save password for 'clusterAdmin@test-cluster:3306'? [Y]es/[N]o/Ne[v]er (default No):
Fetching schema names for auto-completion... Press ^C to stop.
Your MySQL connection id is 38
Server version: 8.0.43 MySQL Community Server - GPL
No default schema selected; type \use <schema> to set one.
 MySQL  test-cluster:3306 ssl  JS > cluster=dba.getCluster()
<Cluster:my-cluster>
 MySQL  test-cluster:3306 ssl  JS > cluster.status()
{
    "clusterName": "my-cluster",
    "defaultReplicaSet": {
        "name": "default",
        "primary": "test-cluster-2:3306",
        "ssl": "REQUIRED",
        "status": "OK",
        "statusText": "Cluster is ONLINE and can tolerate up to ONE failure.",
        "topology": {
            "test-cluster-2:3306": {
                "address": "test-cluster-2:3306",
                "memberRole": "PRIMARY",
                "mode": "R/W",
                "readReplicas": {},
                "replicationLag": "applier_queue_applied",
                "role": "HA",
                "status": "ONLINE",
                "version": "8.0.43"
            },
            "test-cluster-3:3306": {
                "address": "test-cluster-3:3306",
                "memberRole": "SECONDARY",
                "mode": "R/O",
                "readReplicas": {},
                "replicationLag": "applier_queue_applied",
                "role": "HA",
                "status": "ONLINE",
                "version": "8.0.43"
            },
            "test-cluster:3306": {
                "address": "test-cluster:3306",
                "memberRole": "SECONDARY",
                "mode": "R/O",
                "readReplicas": {},
                "replicationLag": "applier_queue_applied",
                "role": "HA",
                "status": "ONLINE",
                "version": "8.0.43"
            }
        },
        "topologyMode": "Single-Primary"
    },
    "groupInformationSourceMember": "test-cluster-2:3306"
}

```

License
-------

GPL-3.0

Other
------------------
[![asciicast](https://asciinema.org/a/8f5KmFqAZeHS8rJBYylBrsZa5.svg)](https://asciinema.org/a/8f5KmFqAZeHS8rJBYylBrsZa5)
