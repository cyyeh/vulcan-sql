import React, { type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { MDXProvider } from '@mdx-js/react';
import * as dayjs from 'dayjs';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import GitHubImageUrl from '@site/static/img/github-icon.png';

dayjs.extend(require('dayjs/plugin/relativeTime'));

const Discord = require('@site/static/img/discord.svg').default;
const GitHub = require('@site/static/img/github.svg').default;

interface GitHubIssueItem {
  url: string;
  html_url: string;
  uid: string;
  title: string;
  content: any;
  date: string;
  avatarUrl: string;
}

const gitHubIssueColumns: GitHubIssueItem[][] = [[], [], []];
[
  {
    html_url: 'https://github.com/Canner/vulcan-sql/issues/138',
    url: 'https://api.github.com/repos/Canner/vulcan-sql/issues/138',
    uid: 'Slach',
    date: '2023-06-21T07:59:54Z',
    title: '[Feature Request] ClickHouse support',
    content: (
      <>
        What’s the problem you're trying to solve: ClickHouse blazing fast
        analytics database <br />I would like to support easy analytics API
        create with our great project
        <br />
        Describe the solution you’d like:
        https://clickhouse.com/docs/en/integrations/language-clients/nodejs
      </>
    ),
    avatarUrl: 'https://avatars.githubusercontent.com/u/105560?v=4',
  },
  {
    html_url: 'https://github.com/Canner/vulcan-sql/pull/160',
    url: 'https://api.github.com/repos/Canner/vulcan-sql/pulls/160',
    uid: 'andreashimin',
    date: '2023-05-18T06:40:24Z',
    title: 'Feature: Support Catalog User Interface',
    content: (
      <>
        Support the VulcanSQL Catalog user interface for retrieving data in a
        more efficient and user-friendly manner.
      </>
    ),
    avatarUrl: 'https://avatars.githubusercontent.com/u/9657305?v=4',
  },
  {
    html_url: 'https://github.com/Canner/vulcan-sql/pull/163',
    url: 'https://api.github.com/repos/Canner/vulcan-sql/pulls/163',
    uid: 'onlyjackfrost',
    date: '2023-05-04T03:15:10Z',
    title: 'Feature: implement snowflake export function',
    content: (
      <>
        This pull request implemented the snowflake export function to export
        the selected data to the local dir in parquet format. <br />
        export flow:
        <br />
        - Use the snowflake "COPY INTO..." command to convert the selected data
        into parquet format and stored in the user stage. This request will have
        a UUID generated by Snowflake, we will append this unique id to the
        stage file name to prevent concurrent copy requests with the same name
        which Snowflake will throw an error.
        <br />
        - Use the snowflake "GET ..." command to download the parquet file
        stored in the user stage to the local directory. We Use the "pattern"
        parameter in this command and filter out the file with the unique id.
        <br />- Use the snowflake "Remove ..." command to remove the parquet
        file in the user stage to avoid increasing costs. We Use the "pattern"
        parameter in this command and filter out the file with the unique id.
      </>
    ),
    avatarUrl: 'https://avatars.githubusercontent.com/u/38731840?v=4',
  },
  {
    html_url: 'https://github.com/Canner/vulcan-sql/issues/143',
    url: 'https://api.github.com/repos/Canner/vulcan-sql/issues/143',
    uid: 'Navrooz',
    date: '2023-02-22T03:12:52Z',
    title: 'Bigquery connection failing',
    content: (
      <>
        I have been trying to connect VulcanSQL with BigQuery but receive an
        error 'Not found'.
        <br />
        Also, not getting any endpoints in /localhost/doc
        <br />
        The credentials file is working fine as I tested the connection with
        DBeaver.
        <br />
        profiles, vulcan, sql and yaml files are at the below link.
        <br />
        Files:
        https://drive.google.com/drive/folders/1g1lyEG32x63hAzrIo2JK8vFAk5GpNC1U?usp=sharing
      </>
    ),
    avatarUrl: 'https://avatars.githubusercontent.com/u/4967042?v=4',
  },
  {
    html_url: 'https://github.com/Canner/vulcan-sql/pull/140',
    url: 'https://api.github.com/repos/Canner/vulcan-sql/pulls/140',
    uid: 'fredalai',
    date: '2023-01-17T03:15:44Z',
    title: 'Feature: Dynamic data masking - custom string',
    content: (
      <>
        We can generate different queries depending on the user attribute, so it
        is easy to mask some columns manually
        <br />
        But manually masking each column might be annoying and unpredictable, we
        should provide "masking" tag with some masking functions.
      </>
    ),
    avatarUrl: 'https://avatars.githubusercontent.com/u/42527625?v=4',
  },
  {
    html_url: 'https://github.com/Canner/vulcan-sql/pull/131',
    url: 'https://api.github.com/repos/Canner/vulcan-sql/pulls/131',
    uid: 'JSYOU',
    date: '2022-11-03T06:05:38Z',
    title: 'Feature: BigQuery support - statement',
    content: (
      <>
        BigQuery is one of the most commonly used warehouses, we should add
        driver support.
        <br />
        Add BigQuery data source and update the document.
      </>
    ),
    avatarUrl: 'https://avatars.githubusercontent.com/u/19495220?v=4',
  },
].forEach((issue, i) => gitHubIssueColumns[i % 3]!.push(issue));

function GitHubCard({
  html_url,
  uid,
  title,
  content,
  date,
  avatarUrl,
}: GitHubIssueItem): JSX.Element {
  return (
    <Link className={styles.cardMeta} to={html_url}>
      <div className={clsx('card', styles.cardBlock)}>
        <div className="card__header">
          <div className={`avatar ${styles.cardAvatarBlock}`}>
            <img
              alt={uid}
              className={`avatar__photo ${styles.cardAvatar}`}
              src={avatarUrl}
              loading="lazy"
            />
            <div className={clsx('avatar__intro', styles.cardMeta)}>
              <strong className="avatar__name">{uid}</strong>
              <span>{dayjs(date).fromNow()}</span>
            </div>
            <img
              src={GitHubImageUrl}
              className={`avatar__photo ${styles.gitHubIcon}`}
              alt="GitHub Icon"
            />
          </div>
        </div>
        <div className={clsx('card__body', styles.cardContent)}>
          <strong>{title}</strong>
          <br />
          <p>{content}</p>
        </div>
      </div>
    </Link>
  );
}

function GitHubSection() {
  return (
    <div className={clsx(styles.githubSection)}>
      <div className="container">
        <div className={clsx('row', styles.cardSection)}>
          {gitHubIssueColumns.map((items, i) => (
            <div className="col col--4" key={i}>
              {items.map((item) => (
                <GitHubCard {...item} key={item.url} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Community(): JSX.Element {
  return (
    <section className={styles.communitySection}>
      <h1 className={`text--center ${styles.title}`}>Join the Community</h1>
      <div className={`text--center ${styles.descriptionBlock}`}>
        <div className={`text--center ${styles.description}`}>
          Join the discord group to chat with the developers and directly
          connect with the VulcanSQL team.
        </div>
        <div className={`buttons ${styles.buttonContainer}`}>
          <Link
            className={`button button--outline ${styles.actionButton}`}
            to="https://discord.gg/ztDz8DCmG4"
          >
            <Discord className={styles.actionIcon} role="img" />
            Discord
          </Link>
          <Link
            className={`button button--outline ${styles.actionButton}`}
            to="https://vulcansql.com/docs/intro"
          >
            <GitHub className={styles.actionIcon} role="img" />
            GitHub
          </Link>
        </div>
      </div>
      <GitHubSection />
    </section>
  );
}