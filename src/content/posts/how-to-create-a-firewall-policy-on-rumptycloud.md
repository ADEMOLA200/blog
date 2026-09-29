---
title: "How to Create a Firewall Policy on RumptyCloud"
description: "Create a workspace firewall policy, add allow rules, and attach it to a VM or managed database so only the traffic you intend can get through."
publishedDate: 2026-09-06
author: "Odukoya Abdullahi Ademola"
cover: "/journal/img/firewall-social.jpg"
coverWidth: 1200
coverHeight: 630
card: "/journal/img/firewall-card.webp"
hero: "/journal/img/firewall-hero.webp"
coverAlt: "Cream firewall barrier filtering orange and lime network paths on a blue Journal background"
tags:
  - "Firewall"
  - "Networking"
  - "Security"
  - "Getting Started"
draft: false
---

RumptyCloud firewall policies are workspace-scoped allow lists. You create a policy, add the inbound traffic you want to permit, then attach that policy to a virtual machine or a managed database. Until a policy is attached, it does nothing. Once it is attached, inbound traffic that does not match an allow rule is blocked.

This guide walks through creating a policy in the console, understanding the default SSH and HTTP rules, adding a tighter rule for Postgres, and attaching the policy to a VM and a database.

Official reference: [Firewall Policies](https://docs.rumptycloud.com/firewall-policies/introduction/).

## What you will need

Before you begin, make sure you have:

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- A [virtual machine](/blog/how-to-spin-up-a-virtual-machine-on-rumptycloud/) or a [Postgres database](/blog/how-to-deploy-postgresql-database-rumptycloud/) to attach the policy to
- Optional: the private IP of a VM if you want only that machine to reach your database

> Outbound filtering is not enforced yet. Policies only shape inbound traffic.

## How policies work

A few rules matter before you click anything:

- **Inbound is deny by default** once a policy is attached. Only matching allow rules get through.
- **Attachment is what turns the policy on.** A policy sitting in the list with no attached resources is inactive.
- **An attached policy with zero allow rules blocks all inbound traffic.** Enforcement stops only when you detach the policy.
- **A VM can have more than one policy** attached at the same time.
- **Source CIDRs are enforced** for SSH, for database connections from the internet, and for traffic between resources inside your workspace.
- **HTTP(S) app traffic does not honor source CIDRs yet.** For web apps and deployments, use `0.0.0.0/0` on HTTP ports. Per-IP restrictions for HTTP are coming.

The Firewall Policies overview shows how many policies you have, how many allow rules exist across them, and how many resources those policies are attached to.

## 1. Create a policy

[Sign in to the RumptyCloud console](https://console.rumptycloud.com/signin), select your workspace, then open **Networking & Security → Firewall Policies**.

Use the **Create policy** panel on the left:

1. Enter a **Name** (for example `Web server` or `Staging Server`).
2. Add an optional **Description** (for example `HTTP and SSH access`).
3. Select **+ Create policy**.

The policy appears in the table on the right. It is not attached to anything yet. Click the policy name to open it and manage allow rules.

| Column | Meaning |
| --- | --- |
| **Policy** | Name. Click it to open the policy. |
| **Rules** | Number of allow rules on the policy |
| **Attached** | Number of VMs or databases using it |
| **Default** | Whether this is the workspace default policy |
| **Actions** | Open or delete the policy |

## 2. Understand the default allow rules

New policies include two default inbound rules. They are marked with a **Default** badge. You cannot edit them, but you can delete them.

| Direction | Protocol | Port | Source | Description |
| --- | --- | --- | --- | --- |
| INBOUND | TCP | 22 | `0.0.0.0/0` | Allow SSH. Required for `rumpty ssh` and CLI connectivity. |
| INBOUND | TCP | 8080 | `0.0.0.0/0` | Allow HTTP on the default app port used by RumptyCloud VMs. |

Keep the port **22** rule if this policy will be attached to a VM you reach with `rumpty ssh`. The VM guide already warns about this: attaching a policy that has inbound rules but no port 22 will cut off SSH.

Deleting the port **22** default blocks SSH to attached VMs. The confirmation dialog tells you what traffic will be blocked — read it before you confirm.

## 3. Add an allow rule

On the policy detail page, the left panel is **Add allow rule** and the right panel is the **Allow rules** table.

Fill in the form:

| Field | Details |
| --- | --- |
| **Direction** | Inbound. Outbound is not enforced yet. |
| **Protocol** | TCP, UDP, or All. **All** matches every port, so the port field is hidden. |
| **Port(s)** | A single port such as `22`, or a range such as `8000-9000`. Leave blank to match all ports. Preset buttons fill common services: SSH, HTTP, HTTPS, Postgres, MySQL, Redis. |
| **Source (CIDR)** | Which IPs may connect. `0.0.0.0/0` is anywhere. `192.168.1.0/24` is a subnet. `203.0.113.9/32` is one address. |
| **Description** | Optional label so the table stays readable. |

Select **+ Add allow rule**.

### Example: allow HTTPS on a VM

If you expose a web service on 443, add:

- Direction: **Inbound**
- Protocol: **TCP**
- Port: **443** (or use the HTTPS preset)
- Source: `0.0.0.0/0`
- Description: `Public HTTPS`

Remember that source CIDRs are not honored for HTTP(S) app traffic yet. `0.0.0.0/0` is the right source for web ports today.

### Example: allow only one VM to reach Postgres

If the client is another resource in the same workspace — for example a VM that should be the only thing allowed to reach your database — use that VM's **private IP** with a `/32` suffix.

Traffic between workspace resources travels over the private network with its real source address, so a narrow CIDR works as expected.

- Direction: **Inbound**
- Protocol: **TCP**
- Port: **5432** (or use the Postgres preset)
- Source: `10.42.0.7/32` (replace with your VM's private IP)
- Description: `App VM to Postgres`

You can find the VM private IP on the VM detail page after the machine is running.

## 4. Edit or delete a rule

Each row in the **Allow rules** table has **Edit** and **Delete** on the right.

- **Edit** loads the rule into the form on the left. Change it, then select **Save rule**.
- **Delete** asks for confirmation and shows the rule's protocol, port, and source.

Default rules cannot be edited. If you need a different source for SSH, delete the default port 22 rule only after you have added a replacement that still lets you connect.

## 5. Attach the policy to a VM

You can attach from either side. Both do the same thing.

### From the policy

On the policy detail page, find **Attached resources**. If the list is empty, the policy exists but is not active anywhere.

1. Select **Attach resource**.
2. Pick a VM from your workspace.
3. Confirm.

The panel shows each attached resource's type and status. Use **Detach** on a row to stop enforcement on that resource.

### From the VM

1. Open the VM detail page → **Firewall** tab.
2. Choose a policy from the **Attach policy** dropdown.
3. Select **Attach**.

If nothing is attached, the tab says **No firewall policies are attached to this VM.**

> Attaching a policy with inbound rules activates default inbound deny. Confirm port **22** is in the policy before you attach, or you will lose `rumpty ssh`. Browser console access on the VM is separate from SSH; if you lock yourself out of SSH, use the browser console to keep working while you fix the policy.

Click a policy card to jump back to **Firewall Policies**, or use **View policies** to browse, create, and edit rules.

To detach from the VM, select **Detach** on the policy card. When no policies remain attached, the VM's traffic is no longer filtered by a firewall policy.

## 6. Attach the policy to a database

Managed databases have a **Firewall** tab on the database detail page. Use it the same way as the VM tab: attach or detach workspace policies to control which clients can reach the instance.

A useful pattern:

1. Create a policy named `Postgres from app VM`.
2. Delete the default port **22** and **8080** rules if this policy will only sit on a database — those ports are for VMs.
3. Add TCP **5432** from your app VM's private IP (`x.x.x.x/32`), or from your laptop's public IP if you connect with `psql` over the public endpoint.
4. Attach the policy on the database **Firewall** tab.

The public connection endpoint is enabled by default when you create a database. A firewall policy is how you stop the whole internet from trying that endpoint. Source CIDRs **are** enforced for database connections from the internet.

If you still need local `psql` access, add a second allow rule for your current public IP on port 5432, then remove it when you are done.

## 7. Delete a policy

On **Networking & Security → Firewall Policies**, use the delete icon under **Actions**, then confirm. The policy is removed from the workspace.

Detach it from resources first if you only want to stop enforcement without deleting the rule set.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Policy does nothing | It is not attached. Attach it from the policy's **Attached resources** panel, the VM **Firewall** tab, or the database **Firewall** tab. |
| `rumpty ssh` fails after attach | The policy has inbound rules but no TCP 22 allow rule. Detach the policy (or use the browser console), add port 22, then reattach. |
| All inbound traffic is blocked | The policy is attached and has zero allow rules. Add rules or detach the policy. |
| Database connection times out | Attach a policy that allows TCP 5432 from your client IP or the app VM's private `/32`. Confirm the public endpoint is enabled if you are connecting from outside the workspace. |
| HTTP source CIDR is ignored | Expected today. HTTP(S) app traffic does not honor source CIDRs yet. Use `0.0.0.0/0` on HTTP ports. |
| Expected outbound block never happens | Outbound filtering is not enforced yet. |

## Conclusion

You now have a firewall policy you can reuse across VMs and databases. The moving pieces stay the same every time: create the policy, keep or replace the default SSH and HTTP rules, add the ports you actually need, then attach the policy so default inbound deny turns on.

From here, lock a [Postgres database](/blog/how-to-deploy-postgresql-database-rumptycloud/) down to a single [VM](/blog/how-to-spin-up-a-virtual-machine-on-rumptycloud/) private IP, or keep a wider policy on a web VM that still allows SSH and the default app port. Full field-level detail lives in the [allow rules](https://docs.rumptycloud.com/firewall-policies/allow-rules/) and [VM firewall](https://docs.rumptycloud.com/virtual-machines/firewall) docs.
