import {
  CfnOutput,
  DockerImage,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { join } from "path";

export class Cv2Stack extends Stack {
  readonly domainName: string;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const bucket = new Bucket(this, "bucket", {
    //   autoDeleteObjects: true,
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    //   bucketName: "cv-repo",
    //   enforceSSL: true,
    // });

    const cvFileName = "cv.html";

    const asset = new Asset(this, "asset", {
      path: join(__dirname, `../`),
      exclude: ["**", `!${cvFileName}`],
      bundling: {
        image: DockerImage.fromBuild(join(__dirname, "../")),
        command: [
          "bash",
          "-c",
          'echo "heloo from contaiuner" >> /asset-input/cv.html && cp /asset-input/cv.html /asset-output/cv.html',
        ],
      },
    });

    this.domainName = new Distribution(this, "distribution", {
      defaultBehavior: {
        origin: new S3Origin(
          Bucket.fromBucketName(this, "asset-bucket", asset.s3BucketName)
        ),
      },
      defaultRootObject: asset.s3ObjectKey,
    }).domainName;

    new CfnOutput(this, "domainName", {
      value: this.domainName,
    });
  }
}
