# MySQL Cluster — Ansible Role

This Ansible role automates the **installation and configuration of a MySQL Cluster** on Debian- and Red Hat-based systems.  
It performs repository setup, package installation, configuration file deployment, and restarts the MySQL service when configuration changes are detected.

The **first host in the Ansible inventory** functions as the *primary (master) node*. Adding additional hosts automatically installs all required packages, deploys configurations, and joins them to the cluster.

***

## Requirements

This role requires **root privileges**.  
You can grant privileges globally or at the role level:

```yaml
- name: Install and configure MySQL Cluster
  hosts: mysql-cluster
  gather_facts: true
  roles:
    - role: mysql-cluster
      become: true
```

***

## Role Variables

All configurable variables are defined in [`defaults/main.yml`].  
Below are the key parameters and their default values:

```yaml
mysql_version: 8.0
configure_ssl_connection: true
firewall_enabled: true
firewall_port:
  - 3306
  - 3307
  - 33060
  - 33061

# Required parameters
mysql_root_pass: ""
mysql_cluster_name: ""
mysql_cluster_admin_user: ""
mysql_cluster_admin_pass: ""
```

By default, the cluster operates in **Single-Primary** mode.  
To enable **Multi-Primary** mode, include:

```yaml
mysql_topology_type: "multinode"
```

***

## Example Playbook

### Role Installation

`requirements.yml`:
```yaml
- src: git@github.com:AleksFirsta/ansible-role-mysql-cluster.git
  scm: git
  version: main
  name: mysql-cluster
```

Install the role:
```bash
ansible-galaxy install -r requirements.yml -p roles/
```

### Cluster Deployment

`playbook.yml`:
```yaml
- name: Install and configure MySQL Cluster
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

***

## Verifying Cluster Status

Connect using MySQL Shell:

```bash
mysqlsh
```

Then:

```plaintext
MySQL JS > \connect clusterAdmin@my-cluster:3306
```

View cluster status:

```plaintext
MySQL JS > cluster = dba.getCluster()
MySQL JS > cluster.status()
```

Example output:

```json
{
    "clusterName": "my-cluster",
    "defaultReplicaSet": {
        "name": "default",
        "primary": "my-cluster-2:3306",
        "ssl": "REQUIRED",
        "status": "OK",
        "statusText": "Cluster is ONLINE and can tolerate up to ONE failure.",
        "topology": {
            "my-cluster-2:3306": {
                "address": "my-cluster-2:3306",
                "memberRole": "PRIMARY",
                "mode": "R/W",
                "readReplicas": {},
                "replicationLag": "applier_queue_applied",
                "role": "HA",
                "status": "ONLINE",
                "version": "8.0.43"
            },
            "my-cluster-3:3306": {
                "address": "my-cluster-3:3306",
                "memberRole": "SECONDARY",
                "mode": "R/O",
                "readReplicas": {},
                "replicationLag": "applier_queue_applied",
                "role": "HA",
                "status": "ONLINE",
                "version": "8.0.43"
            },
            "my-cluster:3306": {
                "address": "my-cluster:3306",
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
    "groupInformationSourceMember": "my-cluster-2:3306"
}
```

***

## License

This project is released under the GNU General Public License v3.0 (GPL‑3.0).
You are free to use, modify, and distribute this software, provided that:

 - The same license (GPL‑3.0) is preserved for any derivative works.
 - Source modifications remain accessible and open under equivalent terms.
 - All distributions include a copy of the GPL‑3.0 license text.
 - Commercial use is permitted, but proprietary redistribution is not.

***

## Demonstration

[![asciicast](https://asciinema.org/a/8f5KmFqAZeHS8rJBYylBrsZa5.svg)](https://asciinema.org/a/8f5KmFqAZeHS8rJBYylBrsZa5)

---